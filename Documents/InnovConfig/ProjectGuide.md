# InnovConfig Project Guide

All of the items marked with a checkbox below are necessary for InnovConfig to work. Use the checklist, you'll be glad you did.

## Pre-requisites

1) Innovator pre-requisites
    - [ ] Windows Pro OS with Admin privileges
    - [ ] IIS installed and configured for Innovator
    - [ ] SQL Server installed with SysAdmin privileges

1) [ ] Git installed

1) [ ] Powershell latest LTS (Long Term Support, 7.4 at time of writing) is installed. This includes the Pester 5.2 module. (OOTB Windows includes Powershell 5.1 for .Net Framework compatability.)  
 
1) Powershell Modules installed. (e.g Load-Module ImportExcel at PS prompt)
    - [ ] ImportExcel
    - [ ] SqlServer 
        - Do this in the default .Net version 5.1 AND the Core version you use, to avoid problems later
        - Use Install-Module SqlServer -Force -AllowClobber, this overwrites SQLPS module installed by SSMS

1) [ ] VS Code installed, with extensions
    - [ ] IntelliCode
    - [ ] markdownwlint
    - [ ] Markdown Checkboxes - lets you use Project and Setup Guide as a checklist in Preview window. Highly recommended.

1) [ ] InnovConfig and Project repos in same folder
    - Project will use InnovConfig using Import-Module
    - Multiple Projects share same InnovConfig

## Setup steps

1. [ ] Read guides in InnovConfig repo

1. [ ] Follow steps in InnovConfig/Documents/SetupGuide.md

1. [ ] MasterConfig.xml needs to be edited for repos on different machines

## Usage notes

- KISS
- main is the root branch
- See Documents\RepoFolderStructure.md for description of folder structure. There may be script errors if any are missing.
- Former Installers folder is removed and replaced by Module InnovConfig. See Documents\InnovConfigGuide.md

- *.-code-workspace is the VS Code workspace file, excluded in .gitignore

## Table of revisions

1) JMH 02/26/2025 First Community Edition
2) JMH 07/06/2025 Community Edition 2025
