#!/usr/bin/python3

# Script to copy and process data from a redpanda-submission server, an
# invite-only backend for contributing photos to redpandafinder.

# Pseudocode:
# 1) rsync all reviews folders from the submissions server
# 2) show all the panda and zoo content one by one
#    - cat the file to the terminal
#    - ask if the entity metadata looks good, or pop an editor
#    - resize and xli each photo associated with this entity
#    - pop an editor for each set of metadata to add tags and confirm
# 3) show all non-reviewed photo metadata
#    - resize and xli the photo associated with this metadata
#    - pop an editor for each set of metadata to add tags and confirm