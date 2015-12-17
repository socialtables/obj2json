import os
import shutil
from .. import constants, logger
from . import _json


def extract_texture_file_path(path):
    """Extract the actual file path from the texture's 'file_path' value,
    which may contain preceding options. Makes the assumption that the file
    path is the last element in the line, and that it doesn't contain any
    spaces.

    :param path: file_path value from the texture
    """
    path_parts = path.split()
    return path_parts[-1];


def copy_registered_textures(dest, src, registration):
    """Copy the registered textures to the destination (root) path

    :param dest: destination directory
    :param src: source directory
    :param registration: registered textures
    :type dest: str
    :type src: str
    :type registration: dict

    """
    logger.debug("io.copy_registered_textures(%s, %s, %s)", dest, src, registration)
    os.makedirs(dest, exist_ok=True)
    for value in registration.values():
        actual_file_path = extract_texture_file_path(value['file_path'])
        full_file_path = os.path.join(src, actual_file_path)
        normalized_path = os.path.normpath(full_file_path)
        copy(normalized_path, dest)


def copy(src, dst):
    """Copy a file to a destination

    :param src: source file
    :param dst: destination file/path

    """
    logger.debug("io.copy(%s, %s)" % (src, dst))
    if os.path.isdir(dst):
        file_name = os.path.basename(src)
        dst = os.path.join(dst, file_name)

    if src != dst:
        shutil.copy(src, dst)


def dump(filepath, data, options=None):
    """Dump the output to disk (JSON, msgpack, etc)

    :param filepath: output file path
    :param data: serializable data to write to disk
    :param options: (Default value = None)
    :type options: dict

    """
    options = options or {}
    logger.debug("io.dump(%s, data, options=%s)", filepath, options)

    compress = options.get(constants.COMPRESSION, constants.NONE)
    if compress == constants.MSGPACK:
        try:
            import msgpack
        except ImportError:
            logger.error("msgpack module not found")
            raise

        logger.info("Dumping to msgpack")
        func = lambda x, y: msgpack.dump(x, y)
        mode = 'wb'
    else:
        round_off = options.get(constants.ENABLE_PRECISION)
        if round_off:
            _json.ROUND = options[constants.PRECISION]
        else:
            _json.ROUND = None

        indent = options.get(constants.INDENT, True)
        indent = 4 if indent else None
        logger.info("Dumping to JSON")
        func = lambda x, y: _json.json.dump(x, y, indent=indent)
        mode = 'w'

    logger.info("Writing to %s", filepath)
    with open(filepath, mode=mode) as stream:
        func(data, stream)


def load(filepath, options):
    """Load the contents of the file path with the correct parser

    :param filepath: input file path
    :param options:
    :type options: dict

    """
    logger.debug("io.load(%s, %s)", filepath, options)
    compress = options.get(constants.COMPRESSION, constants.NONE)
    if compress == constants.MSGPACK:
        try:
            import msgpack
        except ImportError:
            logger.error("msgpack module not found")
            raise
        module = msgpack
        mode = 'rb'
    else:
        logger.info("Loading JSON")
        module = _json.json
        mode = 'r'

    with open(filepath, mode=mode) as stream:
        data = module.load(stream)

    return data
