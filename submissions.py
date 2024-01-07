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
import json
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
    return processing_folder

def iterate_through_contributions(processing_folder):
    """Look at pandas, zoos, and then individual photos in each contribution"""
    for _, subfolder in enumerate(sorted(os.listdir(processing_folder))):
        contribution_folder = os.path.join(processing_folder, subfolder)
        processed = []
        for _, subfile in enumerate(sorted(os.listdir(contribution_folder))):
            contribution_file = os.path.join(contribution_folder, subfile)
            if ".panda.json" in contribution_file:
                process_panda(contribution_file)
                processed.append(contribution_file)
        for _, subfile in enumerate(sorted(os.listdir(contribution_folder))):
            contribution_file = os.path.join(contribution_folder, subfile)
            if ".zoo.json" in contribution_file:
                process_zoo(contribution_file)
                processed.append(contribution_file)
        for _, subfile in enumerate(sorted(os.listdir(contribution_folder))):
            contribution_file = os.path.join(contribution_folder, subfile)
            if ".json" in contribution_file and contribution_file not in processed:
                process_photo(contribution_file)
                processed.append(contribution_file)

def print_metadata_contents(path, contents):
    """Display the file path and its contents, with a divider in-between"""
    print("\n")
    print(path)
    print("\n" + "-" * len(path) + "\n")
    print(contents)
    print("\n")

def process_panda(panda_path):
    with open(panda_path, "r") as rfh:
        panda_file = rfh.read()
        print_metadata_contents(panda_path, panda_file)
        # TODO: fork xli / load set of images
        decision = prompt_for_decision()
        if (decision == "c"):
            return
        elif (decision == "d"):
            os.unlink(panda_path)
            return
        else:
            # TODO: open an editor
            return 

def process_photo(photo_metadata_file):
    pass

def process_zoo(zoo_file):
    pass

def prompt_for_decision():
    options = ["e", "d", "c"]
    decision = input("(e)dit, (d)elete, or (c)ontinue: ")
    if (decision not in options):
        return prompt_for_decision()
    else:
        return decision
    
def read_settings():
    """Servers and folder paths for processing new RPF contributions"""
    infile = configparser.ConfigParser()
    infile.read("./contributions.conf", encoding='utf-8')
    return infile

if __name__ == '__main__':
    config = read_settings()
    processing_folder = copy_review_data_from_submissions_server(config)
    iterate_through_contributions(processing_folder)
    # TODO: turn contributions to git commits on a new branch
