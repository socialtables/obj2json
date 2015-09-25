#!/bin/bash
# NOTE: the ad-hoc output protocol for the Blender script is that the line
# starting -- OBJ-TO-JSON --: will be parsed and the content of that line
# (after -- OBJ-TO-JSON --:) read as the script output. So we ensure that
# our test output fits that protocol
echo "-- OBJ-TO-JSON --: *ENV*:" $(env) " *ARGS*:" $@
