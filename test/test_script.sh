#!/bin/bash
# NOTE: the ad-hoc output protocol for the Blender script is that the line
# starting -- OBJ2JSON --: will be parsed and the content of that line
# (after -- OBJ2JSON --:) read as the script output. So we ensure that
# our test output fits that protocol
echo "-- OBJ2JSON --: *ENV*:" $(env) " *ARGS*:" $@
