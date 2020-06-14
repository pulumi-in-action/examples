#!/bin/bash

source ./scripts/common.sh

for project in ${PROJECTS}
do
    pushd "${project}"
        stack="pulumi-in-action/${project/\//-}/dev"
        pulumi stack init ${stack} || true
        pulumi stack select ${stack}
        pulumi destroy --skip-preview --yes
    popd
done
