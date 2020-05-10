#!/bin/bash

source ./scripts/common.sh

for project in ${PROJECTS}
do
    pushd "${project}"
        pulumi destroy --skip-preview --yes
    popd
done
