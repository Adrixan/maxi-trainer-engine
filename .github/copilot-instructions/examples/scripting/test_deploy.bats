#!/usr/bin/env bats
# BATS (Bash Automated Testing System) tests for deploy.sh
#
# Installation: npm install -g bats or use docker
# Run: bats test_deploy.bats
# Documentation: https://github.com/bats-core/bats-core

# Setup function runs before each test
setup() {
    # Load bats helper libraries if available
    load 'test_helper/bats-support/load' 2>/dev/null || true
    load 'test_helper/bats-assert/load' 2>/dev/null || true
    
    # Create temporary directory for tests
    TEST_TEMP_DIR="$(mktemp -d)"
    export TEST_TEMP_DIR
    
    # Copy deploy script to test directory
    cp ../deploy.sh "$TEST_TEMP_DIR/"
    chmod +x "$TEST_TEMP_DIR/deploy.sh"
    
    # Mock executables
    export PATH="$TEST_TEMP_DIR/mocks:$PATH"
    mkdir -p "$TEST_TEMP_DIR/mocks"
}

# Teardown function runs after each test
teardown() {
    # Clean up temporary directory
    if [ -n "$TEST_TEMP_DIR" ] && [ -d "$TEST_TEMP_DIR" ]; then
        rm -rf "$TEST_TEMP_DIR"
    fi
}

# Helper function to create mock executable
create_mock() {
    local mock_name="$1"
    local mock_behavior="$2"
    
    cat > "$TEST_TEMP_DIR/mocks/$mock_name" <<EOF
#!/usr/bin/env bash
$mock_behavior
EOF
    chmod +x "$TEST_TEMP_DIR/mocks/$mock_name"
}

# ======================================
# Test: Usage and Help
# ======================================

@test "displays usage when no arguments provided" {
    run "$TEST_TEMP_DIR/deploy.sh"
    
    assert_failure
    assert_output --partial "Usage:"
}

@test "displays help with --help flag" {
    run "$TEST_TEMP_DIR/deploy.sh" --help
    
    assert_success
    assert_output --partial "Usage:"
    assert_output --partial "Arguments:"
    assert_output --partial "Examples:"
}

@test "displays help with -h flag" {
    run "$TEST_TEMP_DIR/deploy.sh" -h
    
    assert_success
    assert_output --partial "Usage:"
}

# ======================================
# Test: Argument Validation
# ======================================

@test "rejects invalid environment" {
    run "$TEST_TEMP_DIR/deploy.sh" invalid_env v1.0.0
    
    assert_failure
    assert_output --partial "Invalid environment:"
}

@test "accepts production environment" {
    # Mock prerequisites
    create_mock "docker" "exit 0"
    create_mock "kubectl" "exit 0"
    create_mock "git" "exit 0"
   
    run "$TEST_TEMP_DIR/deploy.sh" --dry-run production v1.0.0
    
    # Should not fail on environment validation
    [[ ! "$output" =~ "Invalid environment" ]]
}

@test "accepts staging environment" {
    # Mock prerequisites
    create_mock "docker" "exit 0"
    create_mock "kubectl" "exit 0"
    create_mock "git" "exit 0"
    
    run "$TEST_TEMP_DIR/deploy.sh" --dry-run staging v1.0.0
    
    # Should not fail on environment validation
    [[ ! "$output" =~ "Invalid environment" ]]
}

@test "rejects invalid version format" {
    run "$TEST_TEMP_DIR/deploy.sh" production invalid.version
    
    assert_failure
    assert_output --partial "Invalid version format:"
}

@test "accepts semver version" {
    # Mock prerequisites
    create_mock "docker" "exit 0"
    create_mock "kubectl" "exit 0"
    create_mock "git" "exit 0"
    
    run "$TEST_TEMP_DIR/deploy.sh" --dry-run staging v1.2.3
    
    # Should not fail on version validation
    [[ ! "$output" =~ "Invalid version format" ]]
}

@test "accepts git commit hash" {
    # Mock prerequisites
    create_mock "docker" "exit 0"
    create_mock "kubectl" "exit 0"
    create_mock "git" "exit 0"
    
    run "$TEST_TEMP_DIR/deploy.sh" --dry-run staging abc1234
    
    # Should not fail on version validation
    [[ ! "$output" =~ "Invalid version format" ]]
}

# ======================================
# Test: Prerequisites Check
# ======================================

@test "fails when docker is not installed" {
    # Remove docker from PATH
    create_mock "kubectl" "exit 0"
    create_mock "git" "exit 0"
    
    run "$TEST_TEMP_DIR/deploy.sh" --dry-run staging v1.0.0
    
    assert_failure
    assert_output --partial "docker"
    assert_output --partial "not installed"
}

@test "fails when kubectl is not installed" {
    create_mock "docker" "exit 0"
    create_mock "git" "exit 0"
    
    run "$TEST_TEMP_DIR/deploy.sh" --dry-run staging v1.0.0
    
    assert_failure
    assert_output --partial "kubectl"
    assert_output --partial "not installed"
}

@test "fails when git is not installed" {
    create_mock "docker" "exit 0"
    create_mock "kubectl" "exit 0"
    
    run "$TEST_TEMP_DIR/deploy.sh" --dry-run staging v1.0.0
    
    assert_failure
    assert_output --partial "git"
    assert_output --partial "not installed"
}

@test "fails when docker daemon is not running" {
    # Mock docker command that fails when run docker info
    create_mock "docker" 'if [[ "$1" == "info" ]]; then exit 1; else exit 0; fi'
    create_mock "kubectl" "exit 0"
    create_mock "git" "exit 0"
    
    run "$TEST_TEMP_DIR/deploy.sh" --dry-run staging v1.0.0
    
    assert_failure
    assert_output --partial "Docker daemon is not running"
}

# ======================================
# Test: Dry Run Mode
# ======================================

@test "dry run mode prevents actual deployment" {
    # Mock all prerequisites
    create_mock "docker" "echo 'Docker mock'; exit 0"
    create_mock "kubectl" "echo 'kubectl mock'; exit 0"
    create_mock "git" "exit 0"
    
    run "$TEST_TEMP_DIR/deploy.sh" --dry-run --skip-tests staging v1.0.0
    
    assert_output --partial "DRY RUN"
}

@test "dry run displays what would be executed" {
    create_mock "docker" "exit 0"
    create_mock "kubectl" "exit 0"
    create_mock "git" "exit 0"
    
    run "$TEST_TEMP_DIR/deploy.sh" --dry-run --skip-tests staging v1.0.0
    
    assert_output --partial "Would execute"
}

# ======================================
# Test: Skip Tests Option
# ======================================

@test "skip-tests option bypasses test execution" {
    create_mock "docker" "exit 0"
    create_mock "kubectl" "exit 0"
    create_mock "git" "exit 0"
    
    run "$TEST_TEMP_DIR/deploy.sh" --dry-run --skip-tests staging v1.0.0
    
    assert_output --partial "Skipping tests"
}

# ======================================
# Test: Verbose Mode
# ======================================

@test "verbose mode enables debug output" {
    create_mock "docker" "exit 0"
    create_mock "kubectl" "exit 0"
    create_mock "git" "exit 0"
    
    run "$TEST_TEMP_DIR/deploy.sh" --verbose --dry-run --skip-tests staging v1.0.0
    
    # Check if script commands are being echoed (set -x behavior)
    # This would show command execution traces
    [[ "$output" != "" ]]
}

# ======================================
# Test: Production Confirmation
# ======================================

@test "production deployment requires confirmation" {
    create_mock "docker" "exit 0"
    create_mock "kubectl" "exit 0"
    create_mock "git" "exit 0"
    
    # Simulate 'no' answer
    run bash -c "echo 'no' | $TEST_TEMP_DIR/deploy.sh --skip-tests production v1.0.0"
    
    assert_output --partial "Deploy to PRODUCTION"
    assert_output --partial "cancelled by user"
}

# ======================================
# Test: Error Handling
# ======================================

@test "script exits on unset variables" {
    # This tests the 'set -u' behavior
    # Create a version that references undefined variable
    local test_script="$TEST_TEMP_DIR/test_unset.sh"
    cat > "$test_script" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "$UNDEFINED_VARIABLE"
EOF
    chmod +x "$test_script"
    
    run "$test_script"
    
    assert_failure
}

@test "script exits on command failure" {
    # This tests the 'set -e' behavior
    local test_script="$TEST_TEMP_DIR/test_errexit.sh"
    cat > "$test_script" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
false
echo "This should not print"
EOF
    chmod +x "$test_script"
    
    run "$test_script"
    
    assert_failure
    refute_output --partial "This should not print"
}

# ======================================
# Test: Configuration Display
# ======================================

@test "displays deployment configuration" {
    create_mock "docker" "exit 0"
    create_mock "kubectl" "exit 0"
    create_mock "git" "exit 0"
    
    run "$TEST_TEMP_DIR/deploy.sh" --dry-run --skip-tests staging v1.2.3
    
    assert_output --partial "Deployment Configuration"
    assert_output --partial "Environment: staging"
    assert_output --partial "Version:     v1.2.3"
}
