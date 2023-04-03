import json
import semver

MANIFEST_FILE = "manifest.json"


def main():
    with open(MANIFEST_FILE) as input:
        data = json.loads(input.read())

        parsed_ver = semver.VersionInfo.parse(data['version'])
        bumped_ver = str(parsed_ver.bump_patch())

        data['version'] = bumped_ver
        data['version_name'] = bumped_ver

    with open(MANIFEST_FILE, 'w') as output:
        json.dump(data, output, indent=2)

    print(f'New version: "{bumped_ver}"')


if __name__ == "__main__":
    main()
