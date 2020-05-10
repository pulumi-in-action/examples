#!/bin/bash

source ./scripts/common.sh

for project in ${PROJECTS}
do
    pushd "${project}"
        pulumi login
        pulumi stack select dev
        pulumi up --yes --skip-preview --non-interactive
    popd
done
