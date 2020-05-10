#!/bin/bash

source ./scripts/common.sh

for project in ${PROJECTS}
do
    pushd "${project}"
        npm install
    popd
done
