#!/usr/bin/python3

# Script to copy and process data from a redpanda-submission server, an
# invite-only backend for contributing photos to redpandafinder.

# Pseudocode:
# 1) rsync all reviews folders from the submissions server
# 2) show all the panda and zoo content one by one
#    - cat the panda/zoo file to the terminal
#    - xli all photos associated with this metadata
#    - pop an editor to review metadata, or delete metadata
#    - resize the photo associated with this entity
# 3) show all non-reviewed photo metadata
#    - cat the metadata file to the terminal
#    - xli the photo associated with this metadata
#    - pop an editor to review/add tags to metadata, or delete meta+photo
#    - resize the photo associated with this entity
#
# This script is designed for Linux, with the following OS packages:
#    rsync, vim, xli
#

import configparser
import os

def copy_review_data_from_submissions_server(config):
    """Use rsync to grab data from the redpanda-submission server"""
    server = config.get("submissions", "contributions_server")
    review_folder = config.get("submissions", "contributions_server_folder")
    user = config.get("submissions", "contributions_user")
    processing_folder = config.get("submissions", "processing_folder")
    rsync_command = 'rsync -avrz {user}@{server}:{review_folder}/* {processing_folder}'.format(
        user=user,
        server=server,
        review_folder=review_folder,
        processing_folder=processing_folder
    )
    os.system(rsync_command)
    return

def read_settings():
    """Servers and folder paths for processing new RPF contributions"""
    infile = configparser.ConfigParser()
    infile.read("./contributions.conf", encoding='utf-8')
    return infile

if __name__ == '__main__':
    config = read_settings()
    copy_review_data_from_submissions_server(config)
