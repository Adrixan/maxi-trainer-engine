# Kubernetes Security Best Practices - Examples

## Secure Deployment

### ❌ Bad Example (Insecure)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: webapp
  template:
    metadata:
      labels:
        app: webapp
    spec:
      containers:
      - name: app
        image: myapp:latest  # Using :latest !
        # Running as root by default
        # No resource limits
        # No security context
```

**Problems:**

- Uses `:latest` tag (unpredictable)
- Runs as root (security risk)
- No resource limits (can consume all node resources)
- No security context (full filesystem access)
- No health checks

---

### ✅ Good Example (Secure & Production-Ready)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp
  namespace: production
  labels:
    app: webapp
    version: v1.2.3
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: webapp
  template:
    metadata:
      labels:
        app: webapp
        version: v1.2.3
    spec:
      # Use specific service account (not default)
      serviceAccountName: webapp-sa
      
      # Security context for pod
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        runAsGroup: 1001
        fsGroup: 1001
        seccompProfile:
          type: RuntimeDefault
      
      containers:
      - name: app
        # Pin specific version/digest
        image: myregistry.io/myapp:1.2.3@sha256:abc123...
        imagePullPolicy: IfNotPresent
        
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        
        # Security context for container
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1001
          capabilities:
            drop:
            - ALL
        
        # Resource limits and requests
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        
        # Liveness probe
        livenessProbe:
          httpGet:
            path: /healthz
            port: http
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
        
        # Readiness probe
        readinessProbe:
          httpGet:
            path: /ready
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 2
          failureThreshold: 2
        
        # Environment variables
        env:
        - name: LOG_LEVEL
          value: "info"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: webapp-secrets
              key: db-password
        
        # Volume mounts
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/cache
        - name: config
          mountPath: /app/config
          readOnly: true
      
      # Volumes (for read-only root filesystem)
      volumes:
      - name: tmp
        emptyDir: {}
      - name: cache
        emptyDir: {}
      - name: config
        configMap:
          name: webapp-config
      
      # Image pull secrets
      imagePullSecrets:
      - name: regcred
      
      # Pod affinity (spread across nodes)
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - webapp
              topologyKey: kubernetes.io/hostname
---
# Service Account (least privilege)
apiVersion: v1
kind: ServiceAccount
metadata:
  name: webapp-sa
  namespace: production
---
# Pod Disruption Budget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: webapp-pdb
  namespace: production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: webapp
```

**Improvements:**

- ✅ Pinned image version with digest
- ✅ Non-root user with explicit UID
- ✅ Read-only root filesystem (with temp volumes)
- ✅ Resource requests and limits
- ✅ Health checks (liveness + readiness)
- ✅ Dropped all capabilities
- ✅ Seccomp profile
- ✅ Pod disruption budget
- ✅ Anti-affinity for high availability

---

## Network Policies

### Default Deny All Traffic

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}  # Applies to all pods in namespace
  policyTypes:
  - Ingress
  - Egress
```

### Allow Specific Traffic

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: webapp-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: webapp
  policyTypes:
  - Ingress
  - Egress
  
  # Ingress rules
  ingress:
  - from:
    # Allow traffic from ingress controller
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  
  # Egress rules
  egress:
  # Allow DNS
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
  
  # Allow traffic to database
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  
  # Allow HTTPS to external services
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443
```

---

## RBAC Configuration

### ❌ Bad (Too Permissive)

```yaml
# DON'T DO THIS!
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: webapp-binding
subjects:
- kind: ServiceAccount
  name: webapp-sa
  namespace: production
roleRef:
  kind: ClusterRole
  name: cluster-admin  # Way too much access!
  apiGroup: rbac.authorization.k8s.io
```

---

### ✅ Good (Least Privilege)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: webapp-role
  namespace: production
rules:
# Only what the app needs
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "watch"]
  resourceNames: ["webapp-config"]  # Specific ConfigMap only

- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]
  resourceNames: ["webapp-secrets"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: webapp-binding
  namespace: production
subjects:
- kind: ServiceAccount
  name: webapp-sa
  namespace: production
roleRef:
  kind: Role
  name: webapp-role
  apiGroup: rbac.authorization.k8s.io
```

---

## Secrets Management

### ❌ Bad (Plain ConfigMap)

```yaml
# NEVER store secrets in ConfigMaps!
apiVersion: v1
kind: ConfigMap
metadata:
  name: webapp-config
data:
  database-password: "SuperSecret123!"  # Plaintext!
```

### ✅ Better (Kubernetes Secret)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: webapp-secrets
  namespace: production
type: Opaque
data:
  # Base64 encoded (not encrypted, just encoded!)
  db-password: U3VwZXJTZWNyZXQxMjMh
```

**Create from command line:**

```bash
kubectl create secret generic webapp-secrets \
  --from-literal=db-password='SuperSecret123!' \
  --namespace=production
```

---

### ✅ Best (Sealed Secrets)

**Install Sealed Secrets Controller:**

```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
```

**Create sealed secret:**

```bash
# Create a regular secret (don't apply it!)
kubectl create secret generic webapp-secrets \
  --from-literal=db-password='SuperSecret123!' \
  --dry-run=client -o yaml | \
# Seal it
kubeseal -o yaml > sealed-secret.yaml

# Now safe to commit to Git!
```

**sealed-secret.yaml (safe to commit):**

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: webapp-secrets
  namespace: production
spec:
  encryptedData:
    db-password: AgBx8G7s... # Encrypted!
```

---

### ✅ Best (External Secrets Operator)

**Install External Secrets Operator:**

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace
```

**Configure SecretStore:**

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: webapp-secrets
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: webapp-secrets
  data:
  - secretKey: db-password
    remoteRef:
      key: prod/webapp/db-password
```

---

## Resource Quotas

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    persistentvolumeclaims: "10"
    pods: "50"
```

---

## Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: webapp-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: webapp
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 30
      selectPolicy: Max
```

---

## Validation

### Dry-run before apply

```bash
# Server-side dry run (validates against actual cluster state)
kubectl apply --dry-run=server -f deployment.yaml

# Validate with kubeval
kubeval deployment.yaml

# Validate with kube-score
kube-score score deployment.yaml

# Security audit with kubeaudit
kubeaudit all -f deployment.yaml
```
