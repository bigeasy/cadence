#!/bin/bash

for version in 0.10.40 0.12.7 4.2.2 5.1.0; do
    brew switch node $version > /dev/null
    echo " % node --version"
    node --version
    for benchmark in call async loop; do
        echo " % node benchmark/increment/$benchmark.js"
        node benchmark/increment/$benchmark.js
    done
done
