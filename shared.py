import datetime

# Shared Python information for the Red Panda Lineage scripts
LINKS_PATH = "./links"
MEDIA_PATH = "./media" 
PANDA_PATH = "./pandas"
OUTPUT_PATH = "./export/redpanda.json"
WILD_PATH = "./wild" 
ZOO_PATH = "./zoos"

# Go back no more than this amount of time to get commits
COMMIT_AGE = 7 * 24 * 60 * 60   # 7 days

# IG alphabet for hashes, time ordering oldest to newest
HASH_ORDER = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"

# Time conversion utility functions
def current_date_to_unixtime():
    """
    Find the unixtime for today's date, at 00:00 hours, for the sake of
    doing one-week windows for new photo updates.
    """
    now = datetime.datetime.now()
    datestring = str(now.year) + "/" + str(now.month) + "/" + str(now.day)
    return datetime_to_unixtime(datestring)

def datetime_to_unixtime(commitdate):
    """
    Take an arbitrary YYYY/MM/DD string and convert it to unixtime, for
    the purpose of determining if a photo was added to RPF during a specific
    time window.
    """
    if commitdate == None:
        return current_date_to_unixtime()
    return int(datetime.datetime.strptime(commitdate, '%Y/%m/%d').strftime("%s"))

# Exceptions
class AuthorError(ValueError):
    pass

class CommitError(IndexError):
    pass

class DateConsistencyError(ValueError):
    pass

class DateFormatError(ValueError):
    pass

class GenderFormatError(ValueError):
    pass

class IdError(KeyError):
    pass

class LinkError(IndexError):
    pass

class NameFormatError(ValueError):
    pass

class SectionNameError(ValueError):
    pass