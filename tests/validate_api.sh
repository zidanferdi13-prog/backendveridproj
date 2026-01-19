#!/bin/bash

# Backend API Validation Script
# This script tests all major API endpoints to verify the implementation

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Backend API Validation Script"
echo "======================================"
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -n "Testing: $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $response)"
    fi
}

# Test Health Check
echo "=== Health & Status ==="
test_endpoint "GET" "/health" "Health check"
test_endpoint "GET" "/api/status" "API status"
echo ""

# Test User API
echo "=== User API ==="
test_endpoint "GET" "/user/userdata" "Get all users"
test_endpoint "GET" "/user/userdata/permissionquery?id_user=test" "Query user permissions"
echo ""

# Test Device API
echo "=== Device API ==="
test_endpoint "GET" "/device/devicedata" "Get all devices"
echo ""

# Test Attendance API
echo "=== Attendance API ==="
test_endpoint "GET" "/attendance/attendancedata" "Get attendance records"
test_endpoint "GET" "/attendance/attendancedata/statistics?start_date=2024-01-01&end_date=2024-01-31" "Get attendance statistics"
echo ""

# Test AttendanceSys API
echo "=== AttendanceSys API ==="
test_endpoint "GET" "/attendancesys/groups" "Get attendance groups"
test_endpoint "GET" "/attendancesys/shifts" "Get shifts"
test_endpoint "GET" "/attendancesys/schedule" "Get schedules"
test_endpoint "GET" "/attendancesys/devices" "Get attendance devices"
test_endpoint "GET" "/attendancesys/dashboard" "Get attendance dashboard"
echo ""

# Test Visitor API
echo "=== Visitor API ==="
test_endpoint "GET" "/visitor/visitordata" "Get all visitors"
test_endpoint "GET" "/visitor/visitordata/review?status=pending" "Get visitor reviews"
echo ""

# Test Permission API
echo "=== Permission API ==="
test_endpoint "GET" "/permission/permissiondata" "Get permission groups"
test_endpoint "GET" "/permission/permissiondata/visitor" "Get visitor permissions"
test_endpoint "GET" "/permission/permissiondata/persons" "Get persons"
echo ""

# Test Log API
echo "=== Log API ==="
test_endpoint "GET" "/log/logdata" "Get general logs"
test_endpoint "GET" "/log/logdata/access?limit=10" "Get access logs"
test_endpoint "GET" "/log/logdata/authorization?limit=10" "Get authorization logs"
test_endpoint "GET" "/log/logdata/operation?limit=10" "Get operation logs"
test_endpoint "GET" "/log/logdata/alarm?limit=10" "Get alarm logs"
echo ""

# Test Settings API
echo "=== Settings API ==="
test_endpoint "GET" "/settings/settingsdata" "Get system settings"
test_endpoint "GET" "/settings/settingsdata/formconfig" "Get form config"
echo ""

# Test Dashboard API
echo "=== Dashboard API ==="
test_endpoint "GET" "/dashboard/stats" "Get dashboard stats"
test_endpoint "GET" "/dashboard/realtime?limit=10" "Get realtime access"
test_endpoint "GET" "/dashboard/activity?hours=24" "Get activity summary"
echo ""

# Test Report API
echo "=== Report API ==="
test_endpoint "GET" "/report/reportdata" "Get reports"
echo ""

echo ""
echo "======================================"
echo "Validation Complete!"
echo "======================================"
echo ""
echo -e "${YELLOW}Note: Some tests may fail if database is empty or MQTT is not connected.${NC}"
echo -e "${YELLOW}Check http://localhost:3000/health for system status.${NC}"
echo ""
