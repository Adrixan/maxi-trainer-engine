#!/usr/bin/env bash
# Description: Example deployment script with best practices
# Usage: ./deploy.sh [production|staging] <version>
# Requirements: docker, kubectl, git

set -euo pipefail  # Exit on error, undefined vars, pipe failures
IFS=$'\n\t'        # Safe word splitting

# Enable debug mode with DEBUG=1
if [[ "${DEBUG:-0}" == "1" ]]; then
    set -x
fi

#######################################
# Configuration
#######################################

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly DOCKER_REGISTRY="registry.example.com"
readonly KUBE_NAMESPACE_PREFIX="myapp"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

#######################################
# Logging Functions
#######################################

log_info() {
    echo -e "${GREEN}[INFO]${NC} $*" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

#######################################
# Error Handling
#######################################

# Cleanup on exit
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Deployment failed with exit code: $exit_code"
    fi
}
trap cleanup EXIT

#######################################
# Usage and Validation
#######################################

usage() {
    cat <<EOF
Usage: $0 [OPTIONS] <environment> <version>

Deploy application to specified environment.

Arguments:
    environment    Target environment (production or staging)
    version        Version to deploy (e.g., v1.2.3 or commit SHA)

Options:
    -h, --help         Show this help message
    -d, --dry-run      Perform a dry run without actual deployment
    -s, --skip-tests   Skip pre-deployment tests
    -v, --verbose      Enable verbose output

Examples:
    $0 staging v1.2.3
    $0 --dry-run production v1.2.4
    $0 -v staging abc123f

Requirements:
    - docker (for building images)
    - kubectl (for Kubernetes deployment)
    - git (for version verification)

EOF
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local required_commands=(docker kubectl git)
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "$cmd is required but not installed"
            return 1
        fi
    done
    
    # Check Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        return 1
    fi
    
    log_info "All prerequisites satisfied"
    return 0
}

validate_environment() {
    local env="$1"
    
    if [[ ! "$env" =~ ^(production|staging)$ ]]; then
        log_error "Invalid environment: $env"
        log_error "Must be 'production' or 'staging'"
        return 1
    fi
    
    return 0
}

validate_version() {
    local version="$1"
    
    # Check if version follows semver or is a valid git commit
    if [[ ! "$version" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]] && \
       [[ ! "$version" =~ ^[0-9a-f]{7,40}$ ]]; then
        log_error "Invalid version format: $version"
        log_error "Must be semver (v1.2.3) or git commit hash"
        return 1
    fi
    
    return 0
}

#######################################
# Deployment Functions
#######################################

build_docker_image() {
    local version="$1"
    local image_tag="${DOCKER_REGISTRY}/myapp:${version}"
    
    log_info "Building Docker image: $image_tag"
    
    cd "$PROJECT_ROOT"
    
    # Build with BuildKit for better caching
    DOCKER_BUILDKIT=1 docker build \
        --tag "$image_tag" \
        --label "version=$version" \
        --label "build-date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        .
    
    log_info "Docker image built successfully"
    echo "$image_tag"
}

run_tests() {
    log_info "Running pre-deployment tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run unit tests
    if [[ -f "package.json" ]]; then
        npm test
    elif [[ -f "pytest.ini" ]] || [[ -f "pyproject.toml" ]]; then
        pytest
    else
        log_warn "No test configuration found, skipping tests"
    fi
    
    log_info "Tests passed"
}

scan_image_security() {
    local image_tag="$1"
    
    log_info "Scanning image for vulnerabilities..."
    
    # Use trivy for security scanning
    if command -v trivy &> /dev/null; then
        if ! trivy image --severity HIGH,CRITICAL "$image_tag"; then
            log_error "Security scan found vulnerabilities"
            return 1
        fi
    else
        log_warn "trivy not installed, skipping security scan"
    fi
    
    log_info "Security scan passed"
    return 0
}

push_docker_image() {
    local image_tag="$1"
    
    log_info "Pushing image to registry: $image_tag"
    
    docker push "$image_tag"
    
    log_info "Image pushed successfully"
}

deploy_to_kubernetes() {
    local environment="$1"
    local version="$2"
    local dry_run="${3:-false}"
    
    local namespace="${KUBE_NAMESPACE_PREFIX}-${environment}"
    local image_tag="${DOCKER_REGISTRY}/myapp:${version}"
    
    log_info "Deploying to Kubernetes namespace: $namespace"
    
    # Check if namespace exists
    if ! kubectl get namespace "$namespace" &> /dev/null; then
        log_error "Namespace $namespace does not exist"
        return 1
    fi
    
    # Update deployment image
    local kubectl_cmd=(
        kubectl set image
        "deployment/myapp"
        "myapp=$image_tag"
        "--namespace=$namespace"
        "--record"
    )
    
    if [[ "$dry_run" == "true" ]]; then
        kubectl_cmd+=(--dry-run=client)
        log_info "DRY RUN: Would execute: ${kubectl_cmd[*]}"
    fi
    
    "${kubectl_cmd[@]}"
    
    if [[ "$dry_run" != "true" ]]; then
        # Wait for rollout to complete
        log_info "Waiting for rollout to complete..."
        kubectl rollout status "deployment/myapp" \
            --namespace="$namespace" \
            --timeout=5m
        
        # Verify deployment
        local ready_replicas
        ready_replicas=$(kubectl get deployment myapp \
            --namespace="$namespace" \
            -o jsonpath='{.status.readyReplicas}')
        
        local desired_replicas
        desired_replicas=$(kubectl get deployment myapp \
            --namespace="$namespace" \
            -o jsonpath='{.spec.replicas}')
        
        if [[ "$ready_replicas" != "$desired_replicas" ]]; then
            log_error "Deployment verification failed"
            log_error "Ready: $ready_replicas, Desired: $desired_replicas"
            return 1
        fi
        
        log_info "Deployment completed successfully"
    fi
}

#######################################
# Main Function
#######################################

main() {
    # Default options
    local dry_run=false
    local skip_tests=false
    local verbose=false
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                usage
                exit 0
                ;;
            -d|--dry-run)
                dry_run=true
                shift
                ;;
            -s|--skip-tests)
                skip_tests=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -*)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
            *)
                break
                ;;
        esac
    done
    
    # Parse arguments
    if [[ $# -ne 2 ]]; then
        log_error "Invalid number of arguments"
        usage
        exit 1
    fi
    
    local environment="$1"
    local version="$2"
    
    # Validation
    validate_environment "$environment" || exit 1
    validate_version "$version" || exit 1
    check_prerequisites || exit 1
    
    # Display deployment info
    log_info "========================================="
    log_info "Deployment Configuration"
    log_info "========================================="
    log_info "Environment: $environment"
    log_info "Version:     $version"
    log_info "Dry Run:     $dry_run"
    log_info "Skip Tests:  $skip_tests"
    log_info "========================================="
    
    # Confirmation for production
    if [[ "$environment" == "production" ]] && [[ "$dry_run" != "true" ]]; then
        read -rp "Deploy to PRODUCTION? This is irreversible. [yes/NO]: " confirm
        if [[ "$confirm" != "yes" ]]; then
            log_warn "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    # Run tests
    if [[ "$skip_tests" != "true" ]]; then
        run_tests || exit 1
    else
        log_warn "Skipping tests as requested"
    fi
    
    # Build image
    local image_tag
    image_tag=$(build_docker_image "$version") || exit 1
    
    # Security scan
    scan_image_security "$image_tag" || exit 1
    
    # Push image (skip for dry run)
    if [[ "$dry_run" != "true" ]]; then
        push_docker_image "$image_tag" || exit 1
    else
        log_info "DRY RUN: Skipping image push"
    fi
    
    # Deploy to Kubernetes
    deploy_to_kubernetes "$environment" "$version" "$dry_run" || exit 1
    
    log_info "========================================="
    log_info "Deployment completed successfully! 🎉"
    log_info "========================================="
}

# Run main function
main "$@"
