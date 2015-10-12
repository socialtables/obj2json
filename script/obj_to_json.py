"""
Convert Wavefront .OBJ files into the Three.js JSON output format via Blender

This script uses Blender to import the given .obj file (and any accompanying
.mtl) into a blank scene and join the meshes together, then export them using
the Three.js exporter.

Along with any output from the Blender environment, it also prints a line to
stdout describing the location of its output JSON file -- this line takes the
form:
-- OBJ2JSON --: {filename}
"""
from __future__ import print_function
import os
import sys
import argparse
# Load up the Blender Python API
import bpy

# This script assumes the `io_three` module is in Blender's `scripts/addons`
# directory or the path to it is set from the environment e.g.
#   BLENDER_USER_SCRIPTS=./three.js/utils/exporters/blender

# Define export options for Three.js
THREE_export_options = {
    "option_vertices": True,
    "option_faces": True,
    "option_normals": True,
    "option_skinning": False,
    "option_bones": False,
    "option_geometry_type": 'geometry',
    "option_influences": 2,
    "option_face_materials": True,
    "option_copy_textures": True,
    "option_embed_animation": True,

    ## Scene ?
    # "option_export_scene": True,

    "option_animation_skeletal": "off",
    "option_frame_step": 1,
    "option_frame_index_as_time": False,

    # Output
    "option_logging": "error",
}


def load_and_convert_obj(options, three_options):
    """
    Perform the .obj -> JSON conversion, using the Blender API to load the
    .obj file, join the objects, and export it again.

    :param options: An object with `input` and `output` attributes describing
      the paths to the input and output files
    :param three_options: A dictionary of options for the Three.js exporter,
      as defined above.
    """
    # Clear the whole default scene -- cube, camera, light
    for ob in bpy.context.scene.objects:
        ob.select = True

    bpy.ops.object.delete()

    # Import the .OBJ file
    bpy.ops.import_scene.obj(filepath=options.input)

    # Select the whole scene which the OBJ creates
    for obj in bpy.context.scene.objects:
        obj.select = True

    # Set the last-touched object as active, and then join the other
    # selected objects into it, so we have 1 resulting mesh
    bpy.context.scene.objects.active = bpy.context.scene.objects[-1]
    bpy.ops.object.join()

    # Export the file!
    bpy.ops.export.three(filepath=options.output, **three_options)


def main():
    """
    Run the script actions from the command-line -- parse arguments (and provide
    help text), print output, etc.
    """
    # get the args passed to blender after "--", all of which are ignored by
    # blender so scripts may receive their own arguments
    if "--" not in sys.argv:
        args = []  # as if no args are passed
    else:
        args = sys.argv[sys.argv.index("--") + 1:]  # get all args after "--"

    # When --help or no args are given, print this help
    usage_text = '''blender --background --addons io_three --python {} -- [options]'''.format(__file__)

    parser = argparse.ArgumentParser(description=usage_text)
    parser.add_argument("-i", "--input", type=str, required=True,
                        help="Path to the input .obj file")
    parser.add_argument("-o", "--output", type=str, required=True,
                        help="Path to the output .json file")

    options = parser.parse_args(args)

    try:
        load_and_convert_obj(options, THREE_export_options)
        # NOTE: Since Blender dumps a lot of largely-irrelevant output to
        # stdout, we need to distinguish our output data in a form that's
        # easy to see and parse.
        print("-- OBJ2JSON --:", options.output, sep="")
    except Exception as e:
        # Ensure that any errors are printed to stderr -- the presence of
        # output in stderr will alert the calling code
        print("ERROR:OBJ2JSON:", e, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
