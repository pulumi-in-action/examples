#!/bin/bash

source ./scripts/common.sh

for project in ${PROJECTS}
do
    echo "${project}"
    pushd "${project}"
        pulumi login
        stack="pulumi-in-action/${project/\//-}/dev"
        pulumi stack init ${stack} || true
        pulumi stack select ${stack}
        pulumi up --yes --skip-preview --non-interactive
    popd
done
