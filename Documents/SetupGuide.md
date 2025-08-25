# InnovConfig Setup Guide

## Setup Checklist


1. [ ] Choose a name to be shared by your new project local instance url, database and new project repository. If the name is MyProject: treat this as case sensitive
    - Your Innovator url will be 'http://localhost/MyProject"
    - The database name will be MyProject
    - The repository name will be MyProject
    - In the following steps, substitute your project name for MyProject.
1. [ ] Install a new Innovator instance using the .msi on your machine using the url from the previous step, for example 'http://localhost/MyProject" .
1. [ ] Backup the database just installed as MyProject for a clean restore.
1. [ ] Create a new repo with the name MyProject at GitHub.com. No ReadMe, .gitignore or Licence.
1. [ ] On your machine, clone the repo in the same folder as InnovConfig. Ignore a warning the repo is empty. This will create a new folder containing the empty repo from GitHub.
1. [ ] Navigatge to the new empty repo in FileExplorer, right click and select 'Open in Terminal'. Copy the following command inside the quotes, "powershell -ExecutionPolicy Bypass -File ../InnovConfigCE/New-Project.ps1", paste it into Terminal and press enter. This copies required files to the MyProject repo. You should see message '... repo will be populated ...'
1. Open the MyProject repo in VSCode, do the following:
    1. [ ] Create a new workspace file, to make using VSCode easier.
    1. [ ] Edit Master_Config.xml for your machine name by copying and editing the sample.
    1. [ ] Edit Param_Config.xml for your project. This lists info that goes into DatabaseUpgrades for imports, plus manifest files for import and AML files to be applied pre and post imports
    1. [ ] Get ImportExport utilities for the Community Edition from http://aras.com/support
    1. [ ] Copy ConsoleUpgrade folder to the repo MyProject/tools folder, so that you have the folder MyProject/tools/ConsoleUpgrade. IOM.dll and Libs.dll will be used by functions in this InnovConfig module
    1. [ ] Add Packages and or src/Pre or PostProcessing to support Param_config
1. [ ] Add and commit content to MyProject repo
1. [ ] In the Project repo (MyProject) follow the UserGuide for 'Step One. InnovConfig 1 - Restore & Import'

## InnovConfig design and structure

InnovConfig uses the structure shown below.

The first step in the checklist above copies required files from here to an empty GitHub repo. The new project repo imports the InnovConfig Module from here, module functions are called from the project repo ,using configurations Master_Config and Param_Config in it. This allows multiple project repos to share a common code-base for InnovConfig.

When InnovConfig is stable it may be shared from a source such as  PowershellGallery, and used with Install-Module rather than Import-Module.

```text
+---AML-Packages           
    - Packages and manifest files
+---AutoTest
    - Pester (Powershell Tester) scripts
+---Documents
    - Documents in markdown format
+---Innovator
    - Innovator Tree
+---InnovConfig
    - Module. See Documents\InnovConfigGuide.md
+---src
    Text files, mostly AML
    +---PostProcessing
        -  applied after Import
    +---PreProcessing
        - applied after Import
    +---Test-AML
        - used by AutoTest
+---Temp
    -emporary files, excluded in .gitignore
    +---Export
        - Destination for Consolue Upgrade, for merging to AML-Pacakges
    \---Logs
        - From ConsoleUprade and other tools
+---tools
    dlls for specific Innovator release
    +---ConsoleUpgrade
    \---IOM.dll
```

## Table of revisions

1. JMH 2/25/2025 - First Community Edition
1. JMH 8/1/2025 - Updates for CE 2025

## Known issues

1. Use-Steps.ps1 is deprecated, it gives 3 Resolve-Path errors, which can be ignored
2. Using VSCode tasks uses Powershell 5.1 unless path to an installed later version is configured 