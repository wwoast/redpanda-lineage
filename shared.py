# Shared Python information for the Red Panda Lineage scripts

PANDA_PATH = "./pandas"
OUTPUT_PATH = "./export/redpanda.json"
ZOO_PATH = "./zoos" 

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