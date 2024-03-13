#!/usr/bin/python3

# This Red Panda Lineage dataset management tool is useful for doing sweeping dataset
# revisions, such as ensuring that a field exists in each panda or zoo file, or removing
# photos taken by a specific credited author.

import git
import os
import re
import sys

from shared import HASH_ORDER, MEDIA_PATH, PANDA_PATH, ZOO_PATH, CommitError, PhotoFile, datetime_to_unixtime, get_max_entity_count, read_settings, update_ig_link
from unidiff import PatchSet

def find_commit_of_removed_photos(author, repo):
    """
    Iterate through the Git repo and find the most recent commit where an 
    author's photos were removed.
    """
    counter = 0
    compare = repo.commit("HEAD")
    for commit in repo.iter_commits('master'):
        diff_raw = repo.git.diff(compare, 
                                 commit,
                                 ignore_blank_lines=True,
                                 ignore_space_at_eol=True)
        patch = PatchSet(diff_raw)
        for change in patch:
            filename = change.path
            if filename.find(".txt") == -1:
                # Don't care about non-data files
                continue
            elif change.removed <= 0:
                # No lines were removed, so we don't care
                continue
            else:
                for hunk in change:
                    for line in hunk:
                        if line.is_removed:
                            # author must be at the end of a line, prepended with ": "
                            line = line.value.strip()
                            search_string = ": " + author
                            if len(line) <= len(search_string):
                                continue
                            expected_location = len(line) - len(search_string)
                            if line.find(search_string) == expected_location:
                                counter = counter + 1
        if counter > 0:
            return commit
        else:
            # Prepare for the next iteration
            compare = commit

def remove_author_from_lineage(author):
    """
    Occasionally users will remove or rename their photo files online.
    For cases where the original files cannot be recovered, it may be
    simpler to remove photos by an author and add them back later.

    Given a author (typically an IG username), remove their photos
    from every panda or zoo data entry.
    """
    repo = git.Repo(".")
    for file_path in [PANDA_PATH, ZOO_PATH, MEDIA_PATH]:
        section = None
        for section_name in ["media", "zoos", "pandas"]:
            if section_name in file_path.split("/"):
                section = section_name.split("s")[0]   # HACK
        # Enter the pandas subdirectories
        for root, dirs, files in os.walk(file_path):
            for filename in files:
                path = root + os.sep + filename
                photo_list = PhotoFile(section, path)
                photo_list.remove_author(author)
                # Done? Let's write config
                photo_list.update_file()
                repo.git.add(path)
    message = "-author: {author}".format(author=author)
    repo.index.commit(message)
    repo.close()

def remove_photo_from_file(path, photo_id):
    """
    Given a file path and a photo index ID, remove the photo and renumber
    all photos inside the file. Determine what the proper configuration
    section header should be from the path itself. Returns the 
    """
    repo = git.Repo(".")
    section = None
    for section_name in ["wild", "media", "zoos", "pandas"]:
        if section_name in path.split("/"):
            section = section_name.split("s")[0]   # HACK
    photo_list = PhotoFile(section, path)
    photo_url = photo_list.get_photo(photo_id)
    if photo_list.delete_photo(photo_id) == True:
        # Read max from an existing photo
        max = int(get_max_entity_count())
        photo_list.renumber_photos(max)
        photo_list.update_file()
        repo.git.add(path)
    message = "-photo: {id}".format(id=photo_id)
    repo.index.commit(message)
    repo.close()
    return photo_url

def remove_photo_from_server(locator):
    if locator.find("cwdc://") != 0:
        return
    config = read_settings()
    server = config.get("submissions", "image_hosting_server")
    image_folder = config.get("submissions", "image_hosting_server_folder")
    user = config.get("submissions", "image_hosting_user")
    filename = locator.replace("cwdc://", "")
    rm_command = 'ssh {user}@{server} rm {folder}/{image}'.format(
        user=user,
        server=server,
        folder=image_folder,
        image=filename
    )
    print('Removing {image} from the server'.format(image=filename))
    os.system(rm_command)

def remove_duplicate_photo_uris_per_file():
    """
    If a file has the same photo URI multiple times, make a new photo entry
    with a union of the tags for each one, and the earlier commitdate.
    TODO: support media duplicates
    """
    repo = git.Repo(".")
    max = int(get_max_entity_count())
    for file_path in [PANDA_PATH, ZOO_PATH]:
        section = None
        for section_name in ["zoos", "pandas"]:
            if section_name in file_path.split("/"):
                section = section_name.split("s")[0]   # HACK
        # Enter the pandas subdirectories
        for root, dirs, files in os.walk(file_path):
            for filename in files:
                path = root + os.sep + filename
                # print(path)
                photo_list = PhotoFile(section, path)
                photo_count = photo_list.photo_count()
                photo_index = 1
                seen = {}
                duplicates = {}
                while (photo_index <= photo_count):
                    current_option = "photo." + str(photo_index)
                    current_uri = photo_list.get_field(current_option)
                    current_author_option = current_option + ".author"
                    current_author = photo_list.get_field(current_author_option)
                    current_date_option = current_option + ".commitdate"
                    current_date = photo_list.get_field(current_date_option)
                    current_date_value = datetime_to_unixtime(current_date)
                    current_link_option = current_option + ".link"
                    current_link = photo_list.get_field(current_link_option)
                    current_tags_option = current_option + ".tags"
                    current_tags = photo_list.get_field(current_tags_option)
                    if current_uri in seen:
                        # We have a duplicate
                        seen_date_value = datetime_to_unixtime(seen[current_uri]["commitdate"])
                        seen_tags = seen[current_uri]["tags"]
                        # Resolve dates and tags
                        if (current_date_value < seen_date_value):
                            seen[current_uri]["commitdate"] = current_date_value
                        # Handle when either of the duplicates have no tags
                        if seen_tags == None and current_tags != None:
                            seen[current_uri]["tags"] = current_tags
                        if seen_tags != None and current_tags != None: 
                            tag_list = current_tags.split(", ") + seen_tags.split(", ")
                            tag_list = sorted(list(dict.fromkeys(tag_list)))   # deduplicate tags
                            seen[current_uri]["tags"] = ", ".join(tag_list)
                        # Add to duplicates list in its current form
                        duplicates[current_uri] = seen[current_uri]
                        # Remove from the photo list
                        photo_list.delete_photo(photo_index)
                        photo_list.delete_photo(seen[current_uri]["old_index"])
                    elif current_uri in duplicates:
                        # We have something duplicated more than once
                        seen_date_value = datetime_to_unixtime(duplicates[current_uri]["commitdate"])
                        seen_tags = duplicates[current_uri]["tags"]
                        # Resolve dates and tags
                        if (current_date_value < seen_date_value):
                            duplicates[current_uri]["commitdate"] = current_date_value
                        # Handle when either of the duplicates have no tags
                        if seen_tags == None and current_tags != None:
                            seen[current_uri]["tags"] = current_tags
                        if seen_tags != None and current_tags != None:
                            tag_list = current_tags.split(", ") + seen_tags.split(", ")
                            tag_list = sorted(list(dict.fromkeys(tag_list)))   # deduplicate tags
                            duplicates[current_uri]["tags"] = ", ".join(tag_list)
                        # Remove from the photo list
                        photo_list.delete_photo(photo_index)
                    else:
                        seen[current_uri] = {}
                        seen[current_uri]["old_index"] = photo_index
                        seen[current_uri]["author"] = current_author
                        seen[current_uri]["commitdate"] = current_date
                        seen[current_uri]["link"] = current_link
                        seen[current_uri]["tags"] = current_tags
                    photo_index = photo_index + 1
                for photo_uri in duplicates.keys():
                    # Add duplicates back to photo file, starting at the newest index
                    photo_option = "photo." + str(photo_index)
                    author_option = photo_option + ".author"
                    author = duplicates[photo_uri]["author"]
                    date_option = photo_option + ".commitdate"
                    date = duplicates[photo_uri]["commitdate"]
                    link_option = photo_option + ".link"
                    link = duplicates[photo_uri]["link"]
                    tags_option = photo_option + ".tags"
                    tags = duplicates[photo_uri]["tags"]
                    photo_list.set_field(photo_option, photo_uri)
                    photo_list.set_field(author_option, author)
                    photo_list.set_field(date_option, date)
                    photo_list.set_field(link_option, link)
                    if (tags != None):
                        photo_list.set_field(tags_option, tags)
                    photo_index = photo_index + 1
                # Update the file if there were any changes, and re-sort the hashes
                duplicate_count = len(duplicates.keys())
                if duplicate_count > 0:
                    print("deduplicated: %s (%s duplicated)" % (path, duplicate_count))
                    photo_list.renumber_photos(max)
                    photo_list.update_file()
                    sort_ig_locators(path)
                    repo.git.add(path)
    message = repo.commit("HEAD").message
    repo.index.commit("deduped: " + message)
    repo.close()

def restore_author_to_lineage(author, prior_commit=None):
    """
    Find the most recent commit where photos by an author were removed.
    Re-add them to the pandas they were removed from. For any panda that
    had photos restored, sort their photo hashes.
    """
    repo = git.Repo(".")
    if prior_commit == None:
        prior_commit = find_commit_of_removed_photos(author, repo)
    # Go back one more from this commit
    current_commit = prior_commit
    prior_commit = str(prior_commit) + "~1"    
    diff_raw = repo.git.diff(prior_commit, 
                             current_commit,
                             ignore_blank_lines=True,
                             ignore_space_at_eol=True)
    # Make list of removed lines per filename, and convert.
    # Handjam this just by iterating on file lines
    path_to_photo_index = {}
    patch = PatchSet(diff_raw)
    for change in patch:
        filename = change.path
        if filename.find(".txt") == -1:
            # Don't care about non-data files
            continue
        elif change.removed <= 0:
            # No lines were removed, so we don't care
            continue
        else:
            # Prepare to add lines
            path_to_photo_index[filename] = {}
            for hunk in change:
                for line in hunk:
                    if line.is_removed:
                        if line.value.find("photo.") != 0:
                            continue
                        [key, value] = line.value.strip().split(": ")
                        path_to_photo_index[filename][key] = value
    # Delete any items where the author isn't the given
    for path in path_to_photo_index.keys():
        for option in list(path_to_photo_index[path].keys()):
            index = option.split(".")[1]
            if path_to_photo_index[path].get("photo." + index + ".author") != author:
                path_to_photo_index[path].pop(option)
    # Iterate through files that are getting photos back.
    # Add the photos to the ends of the files
    for path in path_to_photo_index.keys():
        if not os.path.exists(path):
            # File may have been moved.
            print("%s:\nfile no longer exists, so where do I put this?" % path)
            for key in path_to_photo_index[path].keys():
                print("%s: %s" % (key, value))
            continue
        section = None
        for section_name in ["wild", "media", "zoos", "pandas"]:
            if section_name in path.split("/"):
                section = section_name.split("s")[0]   # HACK
        photo_list = PhotoFile(section, path)
        photo_count = photo_list.photo_count()
        photo_index = photo_count + 1
        index_map = {}
        # Swap the old index to one that's not currently in the file
        for key in path_to_photo_index[path].keys():
            index = key.split(".")[1]
            if index_map.get(index) == None:
                index_map[index] = photo_index
                photo_index = photo_index + 1
            value = path_to_photo_index[path][key]
            key = key.replace("photo." + index, "photo." + str(index_map[index]))
            photo_list.set_field(key, value)
            # print("%s: %s" % (key, value))
        # Update the list of photos
        photo_list.update_file()
    # Finally, sort the photo files
    for path in path_to_photo_index.keys():
        sort_ig_locators(path)
        repo.git.add(path)
    message = "+author: {author}".format(author=author)
    repo.index.commit(message)
    repo.close()

def sort_ig_locators(path):
    """
    Take a zoo/panda file, and sort all photos by their IG locators. This makes
    the photos appear in the order they were uploaded to IG, oldest to newest.
    If a photo does not use an IG URI, keep its index unchanged.
    """
    # IG alphabet for hashes, time ordering oldest to newest
    # print(path)
    print("ig image sorting: %s" % path)
    section = None
    for section_name in ["wild", "zoos", "media", "pandas"]:
        if section_name in path.split("/"):
            section = section_name.split("s")[0]   # HACK
    photo_list = PhotoFile(section, path)
    photo_count = photo_list.photo_count()
    max = int(get_max_entity_count()) + 1
    if photo_count >= max:
        max = photo_count + 1
    non_ig_indices = []
    ig_photos = []
    # Build photo indices of IG photos and non-IG photos
    start_index = 1
    stop_point = max
    photo_index = start_index
    while photo_index <= stop_point:
        photo_option = "photo." + str(photo_index)
        photo = photo_list.get_field(photo_option)
        if photo == None:
            # Missing photo at this index, continue
            photo_index = photo_index + 1
            continue
        # Convert IG photo formats to use new event handler
        photo = update_ig_link(photo)
        photo_list.set_field(photo_option, photo)
        # If our updated photo link has an ig:// uri, do the moving
        if "ig://" in photo:
            # Track the photo and index as a tuple
            ig_photos.append([photo, photo_index])
            # Rename all photo fields as "old_photo_field"
            photo_list.move_field("old." + photo_option, photo_option)
            photo_list.move_field("old." + photo_option + ".author", photo_option + ".author")
            photo_list.move_field("old." + photo_option + ".commitdate", photo_option + ".commitdate")
            photo_list.move_field("old." + photo_option + ".link", photo_option + ".link")
            photo_list.move_field("old." + photo_option + ".tags", photo_option + ".tags")
            if section == "media":
                panda_tags = photo_list.get_field("panda.tags").split(", ")
                for panda_id in panda_tags:
                    photo_item = photo_option + ".tags." + panda_id + ".location"
                    photo_list.move_field("old." + photo_item, photo_item)
        else:
            # Track the non-ig index, so we can avoid it
            # Don't need to rename these photos
            non_ig_indices.append(photo_index)
        photo_index = photo_index + 1
    # Sort the list of cwdc photo tuples by photo URL 
    # (the 0th item in each tuple is the url)
    # (the 4th item in each URL is the ig photo locator)
    ig_photos = sorted(
        ig_photos, 
        key=lambda x: 
            [HASH_ORDER.index(char) for char in x[0].split("/")[-2]])
    ig_photos = sorted(ig_photos, key=lambda x: len(x[0].split("/")[-2]))
    # Now, re-distribute the photos, iterating down the ig
    # photos, moving "old_photo_field" to "photo_field" but with
    # updated indices
    list_index = start_index
    photo_index = start_index
    used_indices = non_ig_indices   # Avoid indices for non-IG photos
    while photo_index <= stop_point:
        if list_index - 1 == len(ig_photos):
            # No more photos, for certain
            break
        [photo, old_index] = ig_photos[list_index - 1]
        photo_index = list_index
        while photo_index in used_indices:
            photo_index = photo_index + 1   # Avoid indices we already used
        used_indices.append(photo_index)
        current_option = "photo." + str(photo_index)
        old_option = "old.photo." + str(old_index)
        photo_list.move_field(current_option, old_option)
        photo_list.move_field(current_option + ".author", old_option + ".author")
        photo_list.move_field(current_option + ".commitdate", old_option + ".commitdate")
        photo_list.move_field(current_option + ".link", old_option + ".link")
        photo_list.move_field(current_option + ".tags", old_option + ".tags")
        if section == "media":
            panda_tags = photo_list.get_field("panda.tags").split(", ")
            for panda_id in panda_tags:
                current_loc_tag =  current_option + ".tags." + panda_id + ".location"
                old_loc_tag = old_option + ".tags." + panda_id + ".location"
                photo_list.move_field(current_loc_tag, old_loc_tag)
        list_index = list_index + 1
    # We're done. Update the photo file
    photo_list.update_file()

def sort_ig_updates():
    """
    Any data file that was updated in the last commit, do a sort operation for
    the IG hashes, leaving non-IG files unchanged. Also add commit dates for
    any photos that don't have them.
    """
    repo = git.Repo(".")
    prior_commit = repo.commit("HEAD~1")
    current_commit = repo.commit("HEAD")
    diff_raw = repo.git.diff(prior_commit, 
                             current_commit,
                             ignore_blank_lines=True,
                             ignore_space_at_eol=True)
    # Start by adding entity and photo commit dates, since this process can
    # change the URIs for doing tracking in the commits
    update_entity_commit_dates(prior_commit.hexsha)
    update_photo_commit_dates(prior_commit.hexsha)
    # Now do the sorting and rewriting
    patch = PatchSet(diff_raw)
    updated_paths = []
    for change in patch:
        filename = change.path
        if filename.find("links") == 0:
            # Don't care about links files
            continue
        if filename.find(".txt") == -1:
            # Don't care about non-data files
            continue
        elif change.added > 0:
            sort_ig_locators(filename)
            updated_paths.append(filename)
    # Add updated files after we're done with all patch analysis
    for filename in set(updated_paths):
        repo.git.add(filename)
    message = repo.commit("HEAD").message
    repo.index.commit("ig-locator sorted commit:\n" + message)
    repo.close()

def sort_image_locators(path):
    """
    Take a zoo/panda file, and sort all photos by their cwdc:// locators. This
    makes the photos appear in the order of the timestamp portion of their
    locator value, oldest to newest. A requirement for sorting a file with
    cwdc:// locators is that every image link in the file must use one of these
    locators. If we find any photos that don't then we skip this file.
    """
    # Uses IG alphabet for hashes, time ordering oldest to newest
    # print(path)
    print("cwdc image sorting: %s" % path)
    section = None
    for section_name in ["wild", "zoos", "media", "pandas"]:
        if section_name in path.split("/"):
            section = section_name.split("s")[0]   # HACK
    photo_list = PhotoFile(section, path)
    photo_count = photo_list.photo_count()
    max = int(get_max_entity_count()) + 1
    if photo_count >= max:
        max = photo_count + 1
    cwdc_photos = []
    # Build photo indices of IG photos and non-IG photos
    start_index = 1
    stop_point = max
    photo_index = start_index
    while photo_index <= stop_point:
        photo_option = "photo." + str(photo_index)
        photo = photo_list.get_field(photo_option)
        if photo == None:
            # Missing photo at this index, continue
            photo_index = photo_index + 1
            continue
        # If our updated photo link has an ig:// uri, do the moving
        if "cwdc://" in photo:
            # Track the photo and index as a tuple
            cwdc_photos.append([photo, photo_index])
            # Rename all photo fields as "old_photo_field"
            photo_list.move_field("old." + photo_option, photo_option)
            photo_list.move_field("old." + photo_option + ".author", photo_option + ".author")
            photo_list.move_field("old." + photo_option + ".commitdate", photo_option + ".commitdate")
            photo_list.move_field("old." + photo_option + ".link", photo_option + ".link")
            photo_list.move_field("old." + photo_option + ".tags", photo_option + ".tags")
            if section == "media":
                panda_tags = photo_list.get_field("panda.tags").split(", ")
                for panda_id in panda_tags:
                    photo_item = photo_option + ".tags." + panda_id + ".location"
                    photo_list.move_field("old." + photo_item, photo_item)
        else:
            # Only update files that have cwdc:// links for every photo
            return False
        photo_index = photo_index + 1
    # Sort the list of cwdc photo tuples by photo URL 
    cwdc_photos = sorted(
        cwdc_photos, 
        key=lambda x: 
            [HASH_ORDER.index(char) for char in x[0].split("/")[-1]])
    cwdc_photos = sorted(cwdc_photos, key=lambda x: len(x[0].split("/")[-1]))
    # Now, re-distribute the photos, iterating down the cwdc
    # photos, moving "old_photo_field" to "photo_field" but with
    # updated indices
    list_index = start_index
    photo_index = start_index
    used_indices = []
    while photo_index <= stop_point:
        if list_index - 1 == len(cwdc_photos):
            # No more photos, for certain
            break
        [photo, old_index] = cwdc_photos[list_index - 1]
        photo_index = list_index
        while photo_index in used_indices:
            photo_index = photo_index + 1   # Avoid indices we already used
        used_indices.append(photo_index)
        current_option = "photo." + str(photo_index)
        old_option = "old.photo." + str(old_index)
        photo_list.move_field(current_option, old_option)
        photo_list.move_field(current_option + ".author", old_option + ".author")
        photo_list.move_field(current_option + ".commitdate", old_option + ".commitdate")
        photo_list.move_field(current_option + ".link", old_option + ".link")
        photo_list.move_field(current_option + ".tags", old_option + ".tags")
        if section == "media":
            panda_tags = photo_list.get_field("panda.tags").split(", ")
            for panda_id in panda_tags:
                current_loc_tag =  current_option + ".tags." + panda_id + ".location"
                old_loc_tag = old_option + ".tags." + panda_id + ".location"
                photo_list.move_field(current_loc_tag, old_loc_tag)
        list_index = list_index + 1
    # We're done. Update the photo file
    photo_list.update_file()
    return True

def sort_image_updates():
    """
    Any data file updated in the last three commits, which only contains urls
    with cwdc:// in them, get sorted using the same logic as to sort the
    IG locators. However, since cwdc:// locators use a ms-since-1970 timestamp,
    we can't sort them alongside the existing Instagram locators, and doing an
    interleaved sort would require porting a lot of code from Javascript, for
    very little benefit.
    """
    repo = git.Repo(".")
    prior_commit = repo.commit("HEAD~1")
    current_commit = repo.commit("HEAD")
    diff_raw = repo.git.diff(prior_commit, 
                             current_commit,
                             ignore_blank_lines=True,
                             ignore_space_at_eol=True)
    # Now do the sorting and rewriting
    patch = PatchSet(diff_raw)
    updated_paths = []
    for change in patch:
        filename = change.path
        if filename.find("links") == 0:
            # Don't care about links files
            continue
        if filename.find(".txt") == -1:
            # Don't care about non-data files
            continue
        elif change.added > 0:
            if sort_image_locators(filename) == True:
                updated_paths.append(filename)
    # Add updated files after we're done with all patch analysis
    for filename in set(updated_paths):
        repo.git.add(filename)
    message = repo.commit("HEAD").message
    repo.index.commit("image-locator sorted commit:\n" + message)
    repo.close()

def update_entity_commit_dates(starting_commit, force=False):
    """
    When moving pandas, the old redpandafinder updater logic considered "new" 
    animals as anything that was a new file in a location. So when an animal
    moved zoos, it became _new_ again. Rectify this by tracking when the
    commitdate for each new animal is. Track commit dates for other files too,
    just for the hell of it.
    """
    filename_to_commit_date = {}
    type_id_to_commit_date = {}
    repo = git.Repo(".")
    # List of sha1-name commits from the repo, oldest to newest
    commit_list = list(reversed(list(map(lambda x: x.hexsha, repo.iter_commits()))))
    if starting_commit != None:
        try:
            index = commit_list.index(starting_commit)
        except IndexError as e:
            raise CommitError("%s not a valid commit in this repo." % starting_commit)
        commit_list = commit_list[index:]   # All after, and including the given commit
    for index, commitish in enumerate(commit_list):
        # End of the commit list? Call it a day
        if commitish == commit_list[len(commit_list) - 1]:
            break
        # Get the diff
        start = commitish
        end = commit_list[index + 1] 
        diff_raw = repo.git.diff(start, end, 
                                 ignore_blank_lines=True,
                                 ignore_space_at_eol=True)
        patch = PatchSet(diff_raw)
        for change in patch:
            filename = change.path
            if filename.find(".txt") == -1:
                # Don't care about non-data files
                continue
            elif change.is_added_file == True:
                compare = "./" + filename
                dt = repo.commit(end).committed_datetime
                date = str(dt.year) + "/" + str(dt.month) + "/" + str(dt.day)
                just_file = filename.split("/").pop()
                just_type = None
                just_id = None
                if compare.find(PANDA_PATH) == 0:
                    just_type = "panda"
                    just_id = just_file.split("_")[0]
                elif compare.find(ZOO_PATH) == 0:
                    just_type = "zoo"
                    just_id = just_file.split("_")[0]
                elif compare.find(MEDIA_PATH) == 0:
                    just_type = "media"
                    just_id = filename   # Need full path for media files
                else:
                    continue    # Not a file we're tracking commitdates for
                filename_to_commit_date[just_file] = date
                type_id_to_commit_date[just_type + "_" + just_id] = date
            else:
                continue
    # print(str(filename_to_commit_date))
    # print(str(type_id_to_commit_date))
    # Now walk the repo, find all panda files without commit dates,
    # and add commitdate to each photo that needs one
    for file_path in [MEDIA_PATH, PANDA_PATH, ZOO_PATH]:
        section = None
        for section_name in ["media", "zoos", "pandas"]:
            if section_name in file_path.split("/"):
                section = section_name.split("s")[0]   # HACK
        # Enter the pandas subdirectories
        for root, dirs, files in os.walk(file_path):
            for filename in files:
                path = root + os.sep + filename
                photo_list = PhotoFile(section, path)
                if photo_list.get_field("commitdate") == None:
                    if filename not in filename_to_commit_date:
                        # file's name was changed at some point
                        just_file = filename.split("/").pop()
                        just_type = None
                        just_id = None
                        if path.find(PANDA_PATH) == 0:
                            just_type = "panda"
                            just_id = just_file.split("_")[0]
                        elif path.find(ZOO_PATH) == 0:
                            just_type = "zoo"
                            just_id = just_file.split("_")[0]
                        elif path.find(MEDIA_PATH) == 0:
                            just_type = "media"
                            just_id = path   # Need full path for media files
                        else:
                            continue    # Not a file we're tracking commitdates for
                        just_key = just_type + "_" + just_id
                        if just_key not in type_id_to_commit_date:
                            print("warning: %s commitdate undetermined" % filename)
                            continue
                        else:
                            date = type_id_to_commit_date[just_key]
                            old_date = photo_list.get_field("commitdate")
                            if ((old_date == None) or (force == True)):
                                photo_list.set_field("commitdate", date)
                    else:
                        date = filename_to_commit_date[filename]
                        old_date = photo_list.get_field("commitdate")
                        if ((old_date == None) or (force == True)):
                            photo_list.set_field("commitdate", date)
                    photo_list.update_file()

def update_photo_commit_dates(starting_commit, force=False):
    """
    The old redpandafinder update logic only worked on the basis of commits
    in the last week or so. When files are re-sorted, added, or removed for
    periods of time, it becomes meaningful to search the entire git repo,
    find when a photo URI first appeared, and then track it using its first
    commit-date into redpandafinder.
    """
    uri_to_commit_date = {}
    repo = git.Repo(".")
    # List of sha1-name commits from the repo, oldest to newest
    commit_list = list(reversed(list(map(lambda x: x.hexsha, repo.iter_commits()))))
    if starting_commit != None:
        try:
            index = commit_list.index(starting_commit)
        except IndexError as e:
            raise CommitError("%s not a valid commit in this repo." % starting_commit)
        commit_list = commit_list[index:]   # All after, and including the given commit
    for index, commitish in enumerate(commit_list):
        # End of the commit list? Call it a day
        if commitish == commit_list[len(commit_list) - 1]:
            break
        # Get the diff
        start = commitish
        end = commit_list[index + 1] 
        diff_raw = repo.git.diff(start, end, 
                                 ignore_blank_lines=True,
                                 ignore_space_at_eol=True)
        patch = PatchSet(diff_raw)
        for change in patch:
            filename = change.path
            if filename.find(".txt") == -1:
                # Don't care about non-data files
                continue
            elif change.added <= 0:
                # No lines were added, so we don't care
                continue
            else:
                for hunk in change:
                    for line in hunk:
                        if line.is_added:
                            if re.match("photo.\d+:", line.value) == None:
                                # Not a photo line
                                continue
                            if line.value.find(": ") == -1:
                                # No correct delimiter, which we see in old commits
                                continue
                            if len(line.value.strip().split(": ")) != 2:
                                # Probably bad linebreaks
                                continue
                            [key, value] = line.value.strip().split(": ")
                            if (value in uri_to_commit_date):
                                # Photo we've already seen
                                continue
                            if (value.find("http") != 0) and (value.find("ig://") != 0):
                                # Not a URI, so not a photo reference
                                continue
                            dt = repo.commit(end).committed_datetime
                            date = str(dt.year) + "/" + str(dt.month) + "/" + str(dt.day)
                            if value not in uri_to_commit_date:
                                # Only insert a commit date once
                                uri_to_commit_date[value] = date
    # print(str(uri_to_commit_date))
    # Now walk the repo, find all files with photo lines that have no commit dates,
    # and add commitdate to each photo that needs one
    for file_path in [PANDA_PATH, ZOO_PATH, MEDIA_PATH]:
        section = None
        for section_name in ["media", "zoos", "pandas"]:
            if section_name in file_path.split("/"):
                section = section_name.split("s")[0]   # HACK
        # Enter the pandas subdirectories
        for root, dirs, files in os.walk(file_path):
            for filename in files:
                path = root + os.sep + filename
                # print(path)
                photo_list = PhotoFile(section, path)
                photo_count = photo_list.photo_count()
                photo_index = 1
                while (photo_index <= photo_count):
                    photo_option = "photo." + str(photo_index)
                    photo_uri = photo_list.get_field(photo_option)
                    date_option = photo_option + ".commitdate"
                    if photo_uri not in uri_to_commit_date:
                        photo_index = photo_index + 1
                        continue
                    date_value = uri_to_commit_date[photo_uri]
                    old_date_value = photo_list.get_field(date_option)
                    if ((old_date_value == None) or (force == True)):
                        photo_list.set_field(date_option, date_value)
                    # print(photo_uri + " ==> " + date_value)
                    photo_index = photo_index + 1
                photo_list.update_file()

if __name__ == '__main__':
    """Choose a utility function."""
    if len(sys.argv) == 2:
        if sys.argv[1] == "--deduplicate-photo-uris":
            remove_duplicate_photo_uris_per_file()
        if sys.argv[1] == "--rewrite-all-commit-dates":
            update_entity_commit_dates(None, force=True)
            update_photo_commit_dates(None, force=True)
            print("please commit to ensure updates are persisted")
        if sys.argv[1] == "--sort-instagram-updates":
            sort_ig_updates()
        if sys.argv[1] == "--sort-image-updates":
            sort_image_updates()
    if len(sys.argv) == 3:
        if sys.argv[1] == "--remove-author":
            author = sys.argv[2]
            remove_author_from_lineage(author)
        if sys.argv[1] == "--restore-author":
            author = sys.argv[2]
            restore_author_to_lineage(author)
        if sys.argv[1] == "--sort-instagram-locators":
            file_path = sys.argv[2]
            sort_ig_locators(file_path)
            # Inner functions don't manage their git commits, so do it here
            repo = git.Repo(".")
            repo.git.add(file_path)
            message = "sorted path: {path}".format(path=file_path)
            repo.index.commit(message)
            repo.close()
        if sys.argv[1] == "--sort-instagram-locators":
            file_path = sys.argv[2]
            if sort_image_locators(file_path) == False:
                print("found non-cwdc:// URLs in the file")
            # Inner functions don't manage their git commits, so do it here
            repo = git.Repo(".")
            repo.git.add(file_path)
            message = "sorted path: {path}".format(path=file_path)
            repo.index.commit(message)
            repo.close()
        if sys.argv[1] == "--update-commit-dates":
            commitish = sys.argv[2]
            update_entity_commit_dates(commitish)
            update_photo_commit_dates(commitish)
            print("please commit to ensure updates are persisted")
    if len(sys.argv) == 4:
        if sys.argv[1] == "--remove-photo":
            file_path = sys.argv[2]
            photo_id = sys.argv[3]
            remove_photo_from_file(file_path, photo_id)
        if sys.argv[1] == "--remove-duplicate":
            file_path = sys.argv[2]
            photo_id = sys.argv[3]
            photo_locator = remove_photo_from_file(file_path, photo_id)
            remove_photo_from_server(photo_locator) 
        if sys.argv[1] == "--restore-author":
            author = sys.argv[2]
            commit = sys.argv[3]
            restore_author_to_lineage(author, commit)

