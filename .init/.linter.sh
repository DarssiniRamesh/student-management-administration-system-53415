#!/bin/bash
cd /home/kavia/workspace/code-generation/student-management-administration-system-53415/student_management_admin_portal
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

