
# SECE2025 User Guide

## Overview

The Systems Engineering Community Edition 2025 contains tailoring of the SA and PLM Package Definitions and a new one SEH5. It contains ItemTypes representing the Processes, Inputs and Outputs described in the INCOSE Systems Engineering Handbook v5, permission to use limited copyright material is pending.

## ItemTypes

SE Process represents the 35 processes described in the Handbook. SE Process has key properties:
- is_template, boolean
- se_system_id, Item(System | System Element) indicating what part of the System Structure the process is for.
- template_id Item(SE Process) id of the emplate the Process was copied from.

SE Input, SE Output and SE Activity are relationships representing the IPO diagrams for each process.

SE IO represent the 200 types of "document" uses as Inputs and Outputs

SE Controlled Item (SECI) is a PolyItem with Morphae System, System Element, Part, Document and CAD.

SE Input and Output have Properties of type  se_io_id Item(SE IO), and se_controlled_item_id Item(SECI). There is no related Item. This design is used to represent Inputs and Outputs as self contained units.

## Getting Started





## Graphical Editor

## Tailoring


