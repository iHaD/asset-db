# asset-db

An asset database for operating game assets just in native file system. It will store uuid to path and vice versa information, and allow user register meta module to convert native files into game engine usable data (json, binary, what ever), and store converted data in asset-library.

Features

  - store uuid-to-path and path-to-uuid table
  - provide simple table and distributed meta solution
    - simple table: store the uuid-to-path and path-to-uuid in one single table, so the assets folder no need to create meta file, also no meta support.
    - distributed meta: store uuid and configuration data in meta file, the meta file will create along with files.
    - seprated meta: store uuid and configuration data in meta file, the meta file will create in seprated folder.
  - import assets from native file system to asset-library.
  - export assets from memory to native file system.
  - allow register your serialize, deserialize method.
  - allow register meta file. asset-db will use meta rules import and export assets.
  - allow mount to multiple `assets/` folder, and register protocol for each of them.
  - support sub-assets, folder-assets.
  - version detected for each meta type, and auto-migration if user provide migration. downgrate allowed.
  - globby batch process.
  - native watch support.
  - cli support.
  - async and streamming process.

## Integrate with editor-framework

The scripts in `core/` and `page/` are used for integrating AssetDB with editor-framework.
