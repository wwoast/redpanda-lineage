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

from shared import ProperlyDelimitedConfigParser
from collections import OrderedDict
from PIL import Image
from datetime import datetime
import json
import os
import subprocess
import sys

RESIZE = 400   # pixels

def convert_json_to_configparser(metadata_path, metadata_file):
    currentTime = datetime.now()
    commitTimeMs = int(currentTime.timestamp() * 1000)
    def basic_date(unixMs):
        date = datetime.fromtimestamp(unixMs / 1000)
        return '{year}/{month}/{day}'.format(
            year=date.year,
            month=date.month,
            day=date.day
        )
    def convert_json_to_panda(config, metadata):
        language = metadata["language"]
        nameKey = language + ".name"
        nicknamesKey = language + ".nicknames"
        othernamesKey = language + ".othernames"
        config.set("panda", "_id", metadata._id)
        config.set("panda", "birthday", basic_date(metadata["birthday"]))
        config.set("panda", "commitdate", basic_date(commitTimeMs))
        config.set("panda", "gender", metadata["gender"])
        config.set("panda", nameKey, metadata["name"])
        config.set("panda", nicknamesKey, "none")
        config.set("panda", othernamesKey, "none")
        config.set("panda", "language.order", language)
        return config
    def convert_json_to_photo_sections(config, section, metadata):
        locators = metadata.get("photo_locators")
        if locators == None:   # Photo metadata file minus .json
            locators = [".".join(os.path.basename(metadata_path).split(".")[0:2])]
        guessLink = "https://www.instagram.com/{author}".format(
            author = metadata["author"]
        )
        index = 1
        for locator in locators:
            keyPrefix = "photo." + str(index)
            photoValue = "cwdc://" + locator
            config.set(section, keyPrefix, photoValue)
            config.set(section, keyPrefix + ".author", metadata["author"])
            config.set(section, keyPrefix + ".commitdate", basic_date(commitTimeMs))
            config.set(section, keyPrefix + ".link", guessLink)
            config.set(section, keyPrefix + ".tags", ", ".join(metadata["tags"]))
        return config
    def convert_json_to_zoo(config, metadata):
        currentTime = datetime.now()
        commitTimeMs = int(currentTime.timestamp() * 1000)
        language = metadata["language"]
        addressKey = language + ".address"
        nameKey = language + ".name"
        config.set("zoo", "_id", metadata._id)
        config.set("zoo", "commitdate", basic_date(commitTimeMs))
        config.set("zoo", addressKey, metadata["address"])
        config.set("zoo", nameKey, metadata["name"])
        config.set("zoo", "language.order", language)
        config.set("zoo", "latitude", metadata["latitude"])
        config.set("zoo", "longitude", metadata["longitude"])
        config.set("zoo", "map", "none")   # TODO
        config.set("zoo", "website", metadata["website"])
        return config
    def write_config(config_path, config):
        with open(config_path, "w") as wfh:
            config.write(wfh)
    metadata = json.loads(metadata_file)
    config_path = metadata_path.replace('.json', '.txt')
    if ".panda." in config_path:
        config = ProperlyDelimitedConfigParser(default_section="panda", delimiters=(':'))
        config = convert_json_to_panda(config, metadata)
        config = convert_json_to_photo_sections(config, "panda", metadata)
        write_config(config_path, config)
    elif ".zoo." in config_path:
        config = ProperlyDelimitedConfigParser(default_section="zoo", delimiters=(':'))
        config = convert_json_to_zoo(config, metadata)
        config = convert_json_to_photo_sections(config, "zoo", metadata)
        write_config(config_path, config)
    else:
        config = ProperlyDelimitedConfigParser(default_section="photo", delimiters=(':'))
        config = convert_json_to_photo_sections(config, "photo", metadata)
        write_config(config_path, config)

def copy_images_to_image_server(photo_paths):
    """Use scp to put photo files on an image server"""
    server = config.get("submissions", "image_hosting_server")
    destination_folder = config.get("submissions", "image_hosting_server_folder")
    user = config.get("submissions", "image_hosting_user")
    scp_command = 'scp {photo_paths} {user}@{server}:{destination_folder}'.format(
        photo_paths=" ".join(photo_paths),
        user=user,
        server=server,
        destination_folder=destination_folder
    )
    print("\nCopying images to image server...")
    result = os.system(scp_command)
    if result != 0:
        sys.exit(result)

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
    result = os.system(rsync_command)
    if result != 0:
        sys.exit(result)
    return processing_folder

def display_images(photo_paths):
    """Use xli to open photos for a particular metadata file"""
    xli_command = ["xli"]
    xli_command.extend(photo_paths)
    # run xli in the background, and track it for killing later
    process = subprocess.Popen(xli_command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return process

def flatten_comprehension(matrix):
    return [item for row in matrix for item in row]

def get_image_locators(contribution_path, metadata_path, metadata_file):
    """Given metadata, return the relevant image locators as full paths"""
    metadata = json.loads(metadata_file)
    locators = metadata.get("photo_locators")
    if locators == None:   # Photo metadata file minus .json
        locators = [".".join(os.path.basename(metadata_path).split(".")[0:2])]
    photo_paths = []
    for locator in locators:
        photo_paths.append(os.path.join(contribution_path, locator))
    return photo_paths

def iterate_through_contributions(processing_path):
    """Look at pandas, zoos, and then individual photos in each contribution"""
    for _, subfolder in enumerate(sorted(os.listdir(processing_path))):
        contribution_path = os.path.join(processing_path, subfolder)
        if (os.path.isfile(contribution_path)):
          continue
        processed = []
        results = []
        for _, subfile in enumerate(sorted(os.listdir(contribution_path))):
            contribution_file = os.path.join(contribution_path, subfile)
            if ".panda.json" in contribution_file:
                result = process_entity(contribution_path, contribution_file)
                processed.append(contribution_file)
                if result["status"] == "keep":
                  results.append(result)
        for _, subfile in enumerate(sorted(os.listdir(contribution_path))):
            contribution_file = os.path.join(contribution_path, subfile)
            if ".zoo.json" in contribution_file:
                result = process_entity(contribution_path, contribution_file)
                processed.append(contribution_file)
                if result["status"] == "keep":
                  results.append(result)
        for _, subfile in enumerate(sorted(os.listdir(contribution_path))):
            contribution_file = os.path.join(contribution_path, subfile)
            if ".json" in contribution_file and contribution_file not in processed:
                result = process_entity(contribution_path, contribution_file)
                processed.append(contribution_file)
                if result["status"] == "keep":
                  results.append(result)
        all_photos = flatten_comprehension([p["photos"] for p in results])
        copy_images_to_image_server(all_photos)
        # TODO: we did all the reviews here, so turn the submission folder into
        # a Git commit on a new redpandafinder branch

def print_configfile_contents(entity_path, contents):
    """Display the config file path and its contents, with a divider in-between"""
    config_path = entity_path.replace('.json', '.txt')
    print()
    print(config_path)
    print("-" * len(config_path))
    with open(config_path, "r") as cfh:
        print(cfh.read())

def process_entity(contribution_path, entity_path):
    """Show a metadata file converted from json into configparser format, and
    load a carousel of its (resized) images.
    
    You have the option to edit the metadata file before it is turned into a
    Git commit, or even delete the metadata file so it doesn't get picked up.

    Return an object with the decision, the metadata path, and a list of paths
    """
    with open(entity_path, "r") as rfh:
        config_path = entity_path.replace(".json", ".txt")
        entity_file = rfh.read()
        convert_json_to_configparser(entity_path, entity_file)
        print_configfile_contents(entity_path, entity_file)
        photo_paths = get_image_locators(contribution_path, entity_path, entity_file)
        resize_images(photo_paths)
        xli = display_images(photo_paths)
        decision = prompt_for_decision()
        if (decision == "c"):
            xli.kill()
            return {
                "entity": entity_path,
                "photos": photo_paths,
                "status": "keep",
            }
        elif (decision == "d"):
            cleanup_list = [entity_path]
            cleanup_list.extend(photo_paths)
            for file_path in cleanup_list:
                os.unlink(file_path)
            xli.kill()
            return {
                "entity": entity_path,
                "photos": photo_paths,
                "status": "remove",
            }
        else:
            editor_command = 'vim {config_path}'.format(config_path = config_path)
            os.system(editor_command)
            xli.kill()
            return {
                "entity": entity_path,
                "photos": photo_paths,
                "status": "keep",
            }
        
def prompt_for_decision():
    options = ["e", "d", "c"]
    decision = input("(e)dit, (d)elete, or (c)ontinue: ")
    if (decision not in options):
        return prompt_for_decision()
    else:
        return decision
    
def read_settings():
    """Servers and folder paths for processing new RPF contributions"""
    infile = ProperlyDelimitedConfigParser()
    infile.read("./contributions.conf", encoding='utf-8')
    return infile

def resize_images(photo_paths):
    """Resizes all images to 400px in the largest dimension"""
    for photo_path in photo_paths:
        image = Image.open(photo_path)
        if image.size[0] > RESIZE or image.size[1] > RESIZE:
            ratios = [image.size[0] / RESIZE, image.size[1] / RESIZE]
            resize = [1, 1]
            # If either side is larger than 400px, the ratio will be greater
            # than one. Whichever ratio is the largest, we want to scale both
            # dimensions by that amount.
            if ratios[0] > 1:
                resize[0] = ratios[0]
            if ratios[1] > 1:
                resize[1] = ratios[1]
            if resize[0] > resize[1]:
                resize[1] = resize[0]
            else:
                resize[0] = resize[1]
            resolution = [
                int(image.size[0] / resize[0]), 
                int(image.size[1] / resize[1])
            ]
            resized = image.resize(resolution)
            resized.save(photo_path)

if __name__ == '__main__':
    config = read_settings()
    processing_folder = copy_review_data_from_submissions_server(config)
    iterate_through_contributions(processing_folder)
    # TODO: turn contributions to git commits on a new branch
