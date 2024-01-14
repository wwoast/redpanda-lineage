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
from manage import sort_ig_updates
from PIL import Image
from datetime import datetime
import git
import json
import os
import subprocess
import sys

RESIZE = 400   # pixels
PANDA_INDEX = {}
ZOO_INDEX = {}
LOCATORS = []   # Don't process photos more than once

def convert_configparser_minus_blacklist(in_data, out_data, section, blacklist):
    for option in in_data.options(section):
        if option not in blacklist:
            out_data.set(section, option, in_data.get(section, option))

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
        defaultLanguageOrder = {language, "en"}   # Set, not list 
        languageOrderString = ", ".join(defaultLanguageOrder)
        nameKey = language + ".name"
        nicknamesKey = language + ".nicknames"
        othernamesKey = language + ".othernames"
        zooId = str(int(metadata["zoo"]) * -1)
        config.set("panda", "_notes", metadata["notes"])
        config.set("panda", "birthday", basic_date(metadata["birthday"]))
        config.set("panda", "commitdate", basic_date(commitTimeMs))
        config.set("panda", "gender", metadata["gender"])
        config.set("panda", nameKey, metadata["name"])
        config.set("panda", nicknamesKey, "none")
        config.set("panda", othernamesKey, "none")
        config.set("panda", "language.order", languageOrderString)
        config.set("panda", "species", metadata["species"])
        config.set("panda", "zoo", zooId)
        if not config.has_option("panda", "en.name"):
            config.set("panda", "en.name", "<English-Name-For-Output-File>")
            config.set("panda", "en.nicknames", "none")
            config.set("panda", "en.othernames", "none")
        return config
    def convert_json_to_photo_sections(config, section, metadata):
        locators = metadata.get("photo_locators")
        if locators == None:   # Photo metadata file minus .json
            locators = [".".join(os.path.basename(metadata_path).split(".")[0:2])]
        if metadata["ig_locator"]:
            guessLink = "https://www.instagram.com/p/{ig_locator}".format(
                ig_locator = metadata["ig_locator"]
            )
        else:
            guessLink = "https://www.instagram.com/{author}".format(
                author = metadata["author"]
            )
        guessTags = "<Comma-Separated-List-of-Photo-Tags>"
        if "tags" in metadata:
            guessTags = ", ".join(metadata["tags"])
        index = 1
        for locator in locators:
            keyPrefix = "photo." + str(index)
            photoValue = "cwdc://" + locator
            config.set(section, keyPrefix, photoValue)
            config.set(section, keyPrefix + ".author", metadata["author"])
            config.set(section, keyPrefix + ".commitdate", basic_date(commitTimeMs))
            config.set(section, keyPrefix + ".link", guessLink)
            config.set(section, keyPrefix + ".tags", guessTags)
            index = index + 1
        return config
    def convert_json_to_zoo(config, metadata):
        currentTime = datetime.now()
        commitTimeMs = int(currentTime.timestamp() * 1000)
        language = metadata["language"]
        addressKey = language + ".address"
        localityKey = language + ".location"
        nameKey = language + ".name"
        # Some values are not in the redpanda database, but are here as form
        # fields for the admin to hand-jam values that can persist in the
        # database, for which we don't have a canonical way of forming from
        # arbitrary-language inputs.
        config.set("zoo", "_zoofilename", "<Shortened-Lowercase-Zoo-Name-With-Dashes>")
        config.set("zoo", "commitdate", basic_date(commitTimeMs))
        config.set("zoo", "country.folder", "<Lowercase-Country-Folder-With-Dashes>")
        config.set("zoo", "country.name", "<Country-Name-Mapping-To-A-RPF-Flag>")
        config.set("zoo", addressKey, metadata["address"])
        config.set("zoo", localityKey, "<Locality-Name-State-And-Province>")
        config.set("zoo", nameKey, metadata["name"])
        config.set("zoo", "language.order", language)
        config.set("zoo", "latitude", str(metadata["latitude"]))
        config.set("zoo", "longitude", str(metadata["longitude"]))
        config.set("zoo", "map", "<Google-Maps-Link>")
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
        config.set("photo", "_id", str(metadata["_id"]))
        # Single photo uploads can have IG locators in the submitted data
        config.set("photo", "_ig_locator", metadata["ig_locator"])
        config = convert_json_to_photo_sections(config, "photo", metadata)
        write_config(config_path, config)

def copy_images_to_image_server(results):
    """Use scp to put photo files on an image server"""
    photo_paths = flatten_comprehension([p["photos"] for p in results])
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
    rsync_command = 'rsync -avrz --remove-source-files {user}@{server}:{review_folder}/* {processing_folder}'.format(
        user=user,
        server=server,
        review_folder=review_folder,
        processing_folder=processing_folder
    )
    result = os.system(rsync_command)
    if result != 0:
        sys.exit(result)
    delete_empty_submission_dirs(processing_folder)
    return processing_folder

def count_until_next_photo(config, section):
    index = 1
    while True:
      try:
          config.get(section, 'photo.{index}'.format(index=index))
          index = index + 1
          continue
      except:
          return index

def create_submissions_branch(results):
    """Merge all submission data into files on a new repo branch"""
    try:
        repo = git.Repo(".")
        currentTime = datetime.now()
        branchName = 'submissions-{timestamp}'.format(
            timestamp=int(currentTime.timestamp())
        )
        # Open the Git repo and set to a new branch
        newBranch = repo.create_head(branchName)
        repo.head.reference = newBranch
        messages = []
        changed = []
        # Process the results
        for result in results:
            merge = merge_configuration(result)
            if merge == None:
                continue
            # Add changed content to the commit
            message = '+{locator}: {path}'.format(
                locator=merge["locator"],
                path=os.path.basename(merge["config"])
            )
            messages.append(message)
            changed.append(merge["config"])
        # Add all files that were changed
        for path in set(changed):
            repo.git.add(path)
    finally:
        composite = "\n".join(messages)
        repo.index.commit(composite)
        repo.close()

def delete_empty_submission_dirs(processing_folder):
    contributions = []
    for _, submission in enumerate(os.listdir(processing_folder)):
        submission_path = os.path.join(processing_folder, submission)
        if not os.path.isdir(submission_path):
            continue
        if len(os.listdir(submission_path)) > 0:
            contributions.append(submission_path)
        else:
            os.rmdir(submission_path)
    if len(contributions) == 0:
        print("No contributions to process.")
        sys.exit(-1)

def display_images(photo_paths):
    """Use xli to open photos for a particular metadata file"""
    xli_command = ["xli"]
    xli_command.extend(photo_paths)
    # run xli in the background, and track it for killing later
    process = subprocess.Popen(xli_command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return process

def flatten_comprehension(matrix):
    return [item for row in matrix for item in row]

def find_instagram_locator(config, section, locator):
    if not locator:   # Locator is empty string
        return count_until_next_photo(config, section)
    # Look at all photo indexes by their IG locators
    index = 1
    while True:
      try:
          link = config.get(section, 'photo.{index}'.format(index=index))
          if 'ig://' in link:
              link_locator = link.split("/")[2]
              if locator == link_locator:
                  return index
          index = index + 1
          continue
      except:
          return index


def get_image_locators(contribution_path, metadata_path, metadata_file):
    """Given metadata, return the relevant image locators as full paths"""
    metadata = json.loads(metadata_file)
    locators = metadata.get("photo_locators")
    if locators == None:   # Photo metadata file minus .json
        locators = [".".join(os.path.basename(metadata_path).split(".")[0:2])]
    photo_paths = []
    for locator in locators:
        # Pandas and photos have duplicate metadata, but only process one.
        if locator in LOCATORS:
            continue
        LOCATORS.append(locator)
        photo_paths.append(os.path.join(contribution_path, locator))
    return photo_paths

def index_zoos_and_animals():
    """Index each four-digit ID by folder path"""
    for _, country in enumerate(os.listdir("./pandas")):
        country_path = os.path.join("./pandas", country)
        for _, zoo in enumerate(os.listdir(country_path)):
            zoo_path = os.path.join(country_path, zoo)
            for _, panda in enumerate(os.listdir(zoo_path)):
                panda_path = os.path.join(zoo_path, panda)
                id = os.path.basename(panda_path).split("_")[0]
                PANDA_INDEX[id] = panda_path
    for _, country in enumerate(os.listdir("./zoos")):
        country_path = os.path.join("./zoos", country)
        for _, zoo in enumerate(os.listdir(country_path)):
            zoo_path = os.path.join(country_path, zoo)
            id = os.path.basename(zoo_path).split("_")[0]
            ZOO_INDEX[id] = zoo_path

def iterate_through_contributions(processing_path):
    """Look at pandas, zoos, and then individual photos in each contribution"""
    results = []
    for _, subfolder in enumerate(sorted(os.listdir(processing_path))):
        contribution_path = os.path.join(processing_path, subfolder)
        if (os.path.isfile(contribution_path)):
          continue
        processed = []
        for _, subfile in enumerate(sorted(os.listdir(contribution_path))):
            contribution_file = os.path.join(contribution_path, subfile)
            if ".panda.json" in contribution_file:
                result = process_entity(contribution_path, contribution_file, "panda")
                processed.append(contribution_file)
                if result["status"] == "keep":
                  results.append(result)
        for _, subfile in enumerate(sorted(os.listdir(contribution_path))):
            contribution_file = os.path.join(contribution_path, subfile)
            if ".zoo.json" in contribution_file:
                result = process_entity(contribution_path, contribution_file, "zoo")
                processed.append(contribution_file)
                if result["status"] == "keep":
                  results.append(result)
        for _, subfile in enumerate(sorted(os.listdir(contribution_path))):
            contribution_file = os.path.join(contribution_path, subfile)
            if ".json" in contribution_file and contribution_file not in processed:
                result = process_entity(contribution_path, contribution_file, "photo")
                processed.append(contribution_file)
                if result["status"] == "keep":
                  results.append(result)
    return results

def merge_configuration(result):
    """Make a commit for each metadata file in lexicographic order"""
    def copy_across_configs(in_data, in_section, in_key, out_data, out_section, out_key):
        out_data.set(
            out_section,
            out_key,
            in_data.get(in_section, in_key)
        )
    def get_panda_output_file_from_zoo_data(zoo_id, panda_id, en_name):
        zoo_path = ZOO_INDEX[zoo_id]
        panda_country = zoo_path.split("/")[2]
        panda_zoo = zoo_path.split("/")[3].replace(".txt", "")
        panda_path = "./pandas/{country}/{zoo}/{id}_{name}.txt".format(
            country=panda_country,
            zoo=panda_zoo,
            id=panda_id,
            name=en_name
        )
        return panda_path
    in_data = ProperlyDelimitedConfigParser()
    in_data.read(result["config"])
    if in_data.has_section("panda"):
        new_panda_id = int(sorted(PANDA_INDEX.keys()).pop()) + 1
        panda_check_id = '{:04d}'.format(abs(new_panda_id))
        zoo_id = int(in_data.get("panda", "zoo"))
        zoo_check_id = '{:04d}'.format(abs(zoo_id))
        # pandas have to have an en.name to determine their output file
        name = in_data.get("panda", "en.name")
        # use the zoo id to determine the output folder
        out_path = get_panda_output_file_from_zoo_data(zoo_check_id, panda_check_id, name)
        PANDA_INDEX[panda_check_id] = out_path
        out_data = ProperlyDelimitedConfigParser(default_section="panda", delimiters=(':'))
        # some values we want based on temp fields or our own checks
        out_data.set("panda", "_id", str(new_panda_id))
        convert_configparser_minus_blacklist(in_data, out_data, "panda", ["_id", "_notes"])
        with open(out_path, "w") as wfh:
            out_data.write(wfh)
        return {
            "config": out_path,
            "locator": "panda",
            "type": "panda"
        }
    elif in_data.has_section("zoo"):
        # fill in some of this data from admin forms
        new_zoo_id = int(sorted(ZOO_INDEX.keys()).pop()) + 1
        check_id = '{:04d}'.format(abs(new_zoo_id))
        out_path = "./zoos/{country}/{id}_{filename}.txt".format(
            country=in_data.get("zoo", "country.folder"),
            id=check_id,
            filename=in_data.get("zoo", "_zoofilename")
        )
        ZOO_INDEX[check_id] = out_path
        out_data = ProperlyDelimitedConfigParser(default_section="zoo", delimiters=(':'))
        # some values we want based on temp fields or our own checks
        out_data.set("zoo", "_id", str(new_zoo_id))
        out_data.set("zoo", "flag", in_data.get("zoo", "country.name"))
        # remove any temp fields we don't want like _zoofilename, country.name, and country.folder
        convert_configparser_minus_blacklist(in_data, out_data, "zoo", [
            "_id", "_zoofilename", "country.name", "country.folder"
        ])
        with open(out_path, "w") as wfh:
            out_data.write(wfh)
        return {
            "config": out_path,
            "locator": "zoo",
            "type": "zoo"
        }
    elif in_data.has_section("photo"):
        # find existing panda or zoo file by search, and incrementally
        # add photos, or replace existing ig:// locators
        id_number = int(in_data.get("photo", "_id"))
        ig_locator = in_data.get("photo", "_ig_locator")
        if (id_number > 0):
            index = PANDA_INDEX
            section = "panda"
        else:
            index = ZOO_INDEX
            section = "zoo"
        check_id = '{:04d}'.format(abs(id_number))   # Up to three leading zeroes
        out_path = index[check_id]
        out_data = ProperlyDelimitedConfigParser(default_section=section, delimiters=(':'))
        out_data.read(out_path)
        out_photo_count = find_instagram_locator(out_data, section, ig_locator)
        in_photo_count = 1
        # Add or swap the photo
        in_photo_key = 'photo.{index}'.format(index=in_photo_count)
        out_photo_key = 'photo.{index}'.format(index=out_photo_count)
        copy_across_configs(in_data, "photo", in_photo_key, out_data, section, out_photo_key)
        # Add the author, but do not update if it's already there (ig_locator swap)
        in_photo_author = 'photo.{index}.author'.format(index=in_photo_count)
        out_photo_author = 'photo.{index}.author'.format(index=out_photo_count)
        if not out_data.has_option(section, out_photo_author):
            copy_across_configs(in_data, "photo", in_photo_author, out_data, section, out_photo_author)
        # Add the commit date, but do not update if it's already there (ig_locator swap)
        in_photo_date = 'photo.{index}.commitdate'.format(index=in_photo_count)
        out_photo_date = 'photo.{index}.commitdate'.format(index=out_photo_count)
        if not out_data.has_option(section, out_photo_date):
            copy_across_configs(in_data, "photo", in_photo_date, out_data, section, out_photo_date)
        # Add the biography link, and swap a bio link with a direct IG photo link
        # if the photo is already there
        in_photo_link = 'photo.{index}.link'.format(index=in_photo_count)
        out_photo_link = 'photo.{index}.link'.format(index=out_photo_count)
        copy_across_configs(in_data, "photo", in_photo_link, out_data, section, out_photo_link)
        # Make a set of both incoming and outgoing tags if they both exist
        in_photo_tags = 'photo.{index}.tags'.format(index=in_photo_count)
        out_photo_tags = 'photo.{index}.tags'.format(index=out_photo_count)
        if not out_data.has_option(section, out_photo_tags):
            copy_across_configs(in_data, "photo", in_photo_tags, out_data, section, out_photo_tags)
        else:
            in_tags = in_data.get("photo", in_photo_tags)
            out_tags = out_data.get(section, out_photo_tags)
            tag_list = in_tags.split(', ')
            out_list = out_tags.split(', ')
            tag_list.extend(out_list)
            tag_set = sorted(set(tag_list))
            tag_set.remove("")
            out_data.set(section, out_photo_tags, ', '.join(tag_set))
        with open(out_path, "w") as wfh:
            out_data.write(wfh)
        return {
            "config": out_path,
            "locator": out_data.get(section, out_photo_key),
            "type": "photo"
        }
    else:
        return None
    
def migrate_submissions_to_submitted():
    processing_folder = config.get("submissions", "processing_folder")
    processed_folder = config.get("submissions", "processed_folder")
    for _, submission in enumerate(os.listdir(processing_folder)):
        submission_path = os.path.join(processing_folder, submission)
        # submissions are all folders
        if os.path.isdir(submission_path):
            submission_path = os.path.join(processing_folder, submission)
            processed_path = os.path.join(processed_folder, submission)
            os.renames(submission_path, processed_path)
 
def print_configfile_contents(config_path):
    """Display the config file path and its contents, with a divider in-between"""
    print()
    print(config_path)
    print("-" * len(config_path))
    with open(config_path, "r") as cfh:
        print(cfh.read())
    # TODO: print notes as a separate field from the entity, if notes exist

def process_entity(contribution_path, entity_path, entity_type):
    """Show a metadata file converted from json into configparser format, and
    load a carousel of its (resized) images.
    
    You have the option to edit the metadata file before it is turned into a
    Git commit, or even delete the metadata file so it doesn't get picked up.

    Return an object with the decision, the metadata path, and a list of paths
    """
    with open(entity_path, "r") as rfh:
        config_path = entity_path.replace(".json", ".txt")
        entity_file = rfh.read()
        photo_paths = get_image_locators(contribution_path, entity_path, entity_file)
        # skip photo metadata files for stuff already processed for a panda or zoo
        if entity_type == "photo" and len(photo_paths) == 0:
            return {
                "config": config_path,
                "photos": photo_paths,
                "status": "remove"
            }
        convert_json_to_configparser(entity_path, entity_file)
        print_configfile_contents(config_path)
        resize_images(photo_paths)
        xli = display_images(photo_paths)
        decision = prompt_for_decision()
        if decision == "c":
            xli.kill()
            return {
                "config": config_path,
                "photos": photo_paths,
                "status": "keep"
            }
        if decision == "d":
            cleanup_list = [entity_path]
            cleanup_list.extend(photo_paths)
            for file_path in cleanup_list:
                os.unlink(file_path)
            xli.kill()
            return {
                "config": config_path,
                "photos": photo_paths,
                "status": "remove"
            }
        else:
            editor_command = 'vim {config_path}'.format(config_path = config_path)
            os.system(editor_command)
            xli.kill()
            return {
                "config": config_path,
                "photos": photo_paths,
                "status": "keep"
            }
        
def prompt_for_decision():
    """Prompt to either edit or delete a contributed metadata file"""
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
        # Files may get deleted prior to resizing
        if not os.path.exists(photo_path):
            continue
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
    index_zoos_and_animals()
    config = read_settings()
    processing_folder = copy_review_data_from_submissions_server(config)
    results = iterate_through_contributions(processing_folder)
    copy_images_to_image_server(results)
    create_submissions_branch(results)
    sort_ig_updates()
    migrate_submissions_to_submitted()
    print("Please merge submissions to master when ready.")
