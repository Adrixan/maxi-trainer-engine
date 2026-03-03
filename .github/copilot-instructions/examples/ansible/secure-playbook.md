# Ansible Security Best Practices - Examples

## Secure Playbook Structure

### ❌ Bad Example (Insecure)

```yaml
---
- hosts: webservers
  tasks:
    # Running with sudo but no explicit become
    - name: Install nginx
      shell: sudo apt-get install -y nginx
      
    # Hardcoded password!
    - name: Create database user
      mysql_user:
        name: admin
        password: "SuperSecret123!"
        
    # Non-idempotent shell command
    - name: Configure app
      shell: echo "CONFIG=true" >> /etc/app.conf
```

**Problems:**

- Using `shell` with `sudo` instead of proper `become`
- Hardcoded secrets in playbook
- Non-idempotent tasks
- No validation or error handling

---

### ✅ Good Example (Secure & Idempotent)

**playbook.yml**

```yaml
---
- name: Configure web servers
  hosts: webservers
  become: yes  # Explicit privilege escalation
  gather_facts: yes
  
  vars_files:
    - vars/main.yml
    - vault.yml  # Encrypted with ansible-vault
  
  pre_tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_os_family == "Debian"
      
  tasks:
    - name: Install nginx
      apt:
        name: nginx
        state: present
      notify: restart nginx
      
    - name: Ensure nginx is running
      service:
        name: nginx
        state: started
        enabled: yes
      
    - name: Deploy nginx configuration
      template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        owner: root
        group: root
        mode: '0644'
        validate: 'nginx -t -c %s'  # Validate before applying
      notify: reload nginx
      
    - name: Create application directory
      file:
        path: /var/www/app
        state: directory
        owner: www-data
        group: www-data
        mode: '0755'
      
    - name: Deploy application configuration
      template:
        src: templates/app.conf.j2
        dest: /etc/app.conf
        owner: root
        group: root
        mode: '0600'  # Sensitive config
      no_log: true  # Don't log sensitive data
      
    - name: Configure database user
      mysql_user:
        name: "{{ db_user }}"
        password: "{{ db_password }}"  # From vault.yml
        priv: "{{ db_name }}.*:ALL"
        host: localhost
        state: present
      no_log: true  # Hide password in logs
      
  handlers:
    - name: restart nginx
      service:
        name: nginx
        state: restarted
        
    - name: reload nginx
      service:
        name: nginx
        state: reloaded
```

---

**vars/main.yml** (non-sensitive variables)

```yaml
---
nginx_worker_processes: 4
nginx_worker_connections: 1024
db_name: webapp
db_user: webapp_user
```

---

**vault.yml** (encrypted with ansible-vault)

```yaml
---
# Encrypt with: ansible-vault encrypt vault.yml
db_password: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          66386439653765386461316465353839...
          
api_key: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          33726366366236653037633630...
```

**Create encrypted variable:**

```bash
# Encrypt entire file
ansible-vault encrypt vault.yml

# Encrypt single variable
ansible-vault encrypt_string 'SuperSecret123!' --name 'db_password'

# View encrypted file
ansible-vault view vault.yml

# Edit encrypted file
ansible-vault edit vault.yml
```

**Run playbook with vault:**

```bash
# Prompt for vault password
ansible-playbook playbook.yml --ask-vault-pass

# Use password file
ansible-playbook playbook.yml --vault-password-file ~/.vault_pass

# Use multiple vault passwords
ansible-playbook playbook.yml --vault-id dev@prompt --vault-id prod@~/.vault_pass_prod
```

---

## Idempotency Examples

### ❌ Bad (Non-Idempotent)

```yaml
- name: Add line to config
  shell: echo "export PATH=$PATH:/opt/bin" >> ~/.bashrc
  # Running twice adds the line twice!
```

### ✅ Good (Idempotent with lineinfile)

```yaml
- name: Add /opt/bin to PATH
  lineinfile:
    path: ~/.bashrc
    line: 'export PATH=$PATH:/opt/bin'
    state: present
  # Running multiple times has no additional effect
```

---

### ❌ Bad (Shell with side effects)

```yaml
- name: Download file
  shell: wget https://example.com/file.tar.gz
  # Always downloads, even if file exists
```

### ✅ Good (Using get_url module)

```yaml
- name: Download file
  get_url:
    url: https://example.com/file.tar.gz
    dest: /tmp/file.tar.gz
    checksum: sha256:abc123...
  # Only downloads if file doesn't exist or checksum differs
```

---

### When shell/command is necessary

```yaml
- name: Check if application is configured
  command: /usr/local/bin/app --check-config
  register: config_check
  changed_when: false  # This command doesn't change anything
  failed_when: config_check.rc not in [0, 1]
  
- name: Configure application
  command: /usr/local/bin/app --configure
  when: config_check.rc == 1
  # Only run if check failed (needs configuration)
```

---

## Validation and Error Handling

```yaml
- name: Deploy configuration file
  template:
    src: haproxy.cfg.j2
    dest: /etc/haproxy/haproxy.cfg
    validate: 'haproxy -c -f %s'  # Validate before replacing
    backup: yes  # Create backup of old file
  notify: reload haproxy

- name: Execute potentially failing task
  command: /usr/bin/risky-command
  register: result
  ignore_errors: yes  # Continue even if fails
  
- name: Handle failure
  debug:
    msg: "Command failed with: {{ result.stderr }}"
  when: result.failed

- name: Ensure critical task succeeds
  command: /usr/bin/critical-command
  register: critical_result
  failed_when: 
    - critical_result.rc != 0
    - "'expected error' not in critical_result.stderr"
  # Fail unless rc is 0 OR stderr contains 'expected error'
```

---

## Security Hardening Playbook

```yaml
---
- name: Security hardening for Ubuntu servers
  hosts: all
  become: yes
  
  tasks:
    - name: Update all packages
      apt:
        upgrade: dist
        update_cache: yes
        
    - name: Install security updates automatically
      apt:
        name: unattended-upgrades
        state: present
        
    - name: Configure automatic security updates
      copy:
        dest: /etc/apt/apt.conf.d/50unattended-upgrades
        content: |
          Unattended-Upgrade::Allowed-Origins {
              "${distro_id}:${distro_codename}-security";
          };
          Unattended-Upgrade::Automatic-Reboot "false";
        mode: '0644'
        
    - name: Disable root login via SSH
      lineinfile:
        path: /etc/ssh/sshd_config
        regexp: '^PermitRootLogin'
        line: 'PermitRootLogin no'
        validate: 'sshd -t -f %s'
      notify: restart sshd
      
    - name: Disable password authentication
      lineinfile:
        path: /etc/ssh/sshd_config
        regexp: '^PasswordAuthentication'
        line: 'PasswordAuthentication no'
        validate: 'sshd -t -f %s'
      notify: restart sshd
      
    - name: Configure firewall - allow SSH
      ufw:
        rule: allow
        port: '22'
        proto: tcp
        
    - name: Configure firewall - allow HTTP
      ufw:
        rule: allow
        port: '80'
        proto: tcp
        
    - name: Configure firewall - allow HTTPS
      ufw:
        rule: allow
        port: '443'
        proto: tcp
        
    - name: Enable firewall
      ufw:
        state: enabled
        policy: deny
        
    - name: Install fail2ban
      apt:
        name: fail2ban
        state: present
        
    - name: Configure fail2ban for SSH
      copy:
        dest: /etc/fail2ban/jail.local
        content: |
          [sshd]
          enabled = true
          port = 22
          filter = sshd
          logpath = /var/log/auth.log
          maxretry = 3
          bantime = 3600
        mode: '0644'
      notify: restart fail2ban
        
  handlers:
    - name: restart sshd
      service:
        name: sshd
        state: restarted
        
    - name: restart fail2ban
      service:
        name: fail2ban
        state: restarted
```

---

## Testing and Validation

### Check Mode (Dry Run)

```bash
# Run in check mode - no changes made
ansible-playbook playbook.yml --check

# Show diffs of what would change
ansible-playbook playbook.yml --check --diff
```

### Linting

```bash
# Install ansible-lint
pip install ansible-lint

# Lint playbook
ansible-lint playbook.yml

# Lint with specific rules
ansible-lint -t security playbook.yml
```

### Molecule Testing Framework

**molecule/default/molecule.yml**

```yaml
---
dependency:
  name: galaxy
driver:
  name: docker
platforms:
  - name: ubuntu-22.04
    image: ubuntu:22.04
    pre_build_image: true
provisioner:
  name: ansible
verifier:
  name: ansible
```

**Run tests:**

```bash
molecule test
```

---

## Performance Optimization

```yaml
---
- name: Optimized playbook
  hosts: webservers
  gather_facts: no  # Disable if not needed (saves time)
  
  tasks:
    - name: Install multiple packages at once
      apt:
        name:
          - nginx
          - python3-pip
          - git
        state: present
      # Faster than separate tasks for each package
      
    - name: Use async for long-running tasks
      command: /usr/bin/long-running-command
      async: 300  # Maximum runtime
      poll: 0  # Fire and forget
      register: long_task
      
    - name: Check async task status later
      async_status:
        jid: "{{ long_task.ansible_job_id }}"
      register: job_result
      until: job_result.finished
      retries: 30
      delay: 10
```

**ansible.cfg performance tuning:**

```ini
[defaults]
forks = 20  # Increase parallelism (default: 5)
host_key_checking = False

[ssh_connection]
pipelining = True  # 2-5x speedup
control_path = %(directory)s/%%h-%%r
```
