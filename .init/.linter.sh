#!/bin/bash
cd /home/kavia/workspace/code-generation/secure-community-management-system-299076-299085/backend_management_api
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

