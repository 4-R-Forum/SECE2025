// =========================
// 1. Bootstrap
// =========================
document.addEventListener("DOMContentLoaded", () => {
    console.log("se_editor.js loaded!");
    init_new();
});

// =========================
// 2. Entry points
// =========================
function init_new() {
    console.log("init_new started");
    refreshSvg();
    bindHideMenu(); // bind once for global doc
}

function init_refresh() {
    setTimeout(refreshSvg, 300);
}

// =========================
// 3. Data fetch & render
// =========================
async function refreshSvg() {
    console.log("refreshSvg called");

    thisItem = parent.thisItem;
    const newString = thisItem.apply("SystemReportServer").getResult();

    const parser = new DOMParser();
    const doc = parser.parseFromString(newString, "image/svg+xml");
    const newSvg = doc.documentElement;
    const newGraph0 = newSvg.querySelector("#graph0");

    const liveSvg = document.getElementById("se_svg");
    const graphMain = liveSvg.querySelector("#graphmain");

    const hasNodes = doc.querySelector(".node") !== null;

    if (hasNodes) {
        console.log("Populated system: inserting Graphviz graph0");
        graphMain.innerHTML = "";
        if (newGraph0) {
            const imported = liveSvg.ownerDocument.importNode(newGraph0, true);
            graphMain.appendChild(imported);
        } else {
            console.warn("Graphviz SVG has no #graph0");
        }
        copySvgAttributes(newSvg, liveSvg);
        liveSvg.setAttribute("width", "100%");
        liveSvg.setAttribute("height", "100%");
        liveSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    } else {
        console.warn("No nodes found — injecting starter SVG");
        const systemId = thisItem.getID();

        const starterSvg = `
      <text x="4" y="14" font-family="Arial" font-size="14.00">
        Drag to Pan, ScrollWheel to Zoom — Ctrl+Right-Click for Inspect
      </text>
      <g id="graphmain" transform="matrix(1 0 0 1 8.7 8.7)" style="opacity:1;">
        <g id="graph0" class="graph" transform="matrix(1.206 0 0 1.206 58 270)">
          <title>g</title>
          <polygon fill="azure" stroke="none"
            points="-4,4 -4,-435 792.24,-435 792.24,4 -4,4"></polygon>
          <g id="node1" class="node" data-options="0"
             this_type="First SE Process" this_id="">
            <title>xSTARTER</title>
            <polygon fill="chartreuse" stroke="black"
              points="280,-144 0,-144 0,-103 280,-103 280,-144" />
            <text text-anchor="middle" x="140" y="-126.7"
              font-family="Segoe UI, Arial, sans-serif" font-size="14.00">
              This System Has No Processes
            </text>
            <text text-anchor="middle" x="140" y="-110.2"
              font-family="Segoe UI, Arial, sans-serif" font-size="14.00">
              Right-Click Here To Create First Process
            </text>
          </g>
        </g>
      </g>`;

        // Parse as SVG, not HTML
        const starterDoc = parser.parseFromString(
            `<svg xmlns="http://www.w3.org/2000/svg">${starterSvg}</svg>`,
            "image/svg+xml"
        );
        const newInner = starterDoc.documentElement.children;

        while (liveSvg.firstChild) liveSvg.removeChild(liveSvg.firstChild);
        for (const child of newInner) {
            liveSvg.appendChild(liveSvg.ownerDocument.importNode(child, true));
        }

        liveSvg.setAttribute("data-options", "0");
        liveSvg.setAttribute("this_type", "sys_System");
        liveSvg.setAttribute("this_id", systemId);
    }

    // --- Bind interactions ---
    const panLayer = liveSvg.querySelector("#panzoom_layer");
    if (panLayer) {
        bindPanzoom(panLayer);
    } else {
        console.warn("No #panzoom_layer found for panzoom binding");
    }
    bindContextMenu(liveSvg);

    // --- Fade-in effect ---
    graphMain.style.opacity = "0.001";
    requestAnimationFrame(() => {
        graphMain.getBBox();
        graphMain.style.opacity = "1";
    });
}

function copySvgAttributes(fromSvg, toSvg) {
    ["width", "height", "viewBox"].forEach(attr => {
        if (fromSvg.hasAttribute(attr)) {
            toSvg.setAttribute(attr, fromSvg.getAttribute(attr));
        }
    });
}


// =========================
// 4. Interaction setup
// =========================
function bindPanzoom(area) {
    if (!area || area._hasPanzoom) return;
    panzoom(area, {
        autocenter: true,
        bounds: true,
        beforeMouseDown: (e) => e.button === 0
    });
    area._hasPanzoom = true;
    console.log("Panzoom bound to", area.id);
}


function bindContextMenu(liveSvg) {
    if (!liveSvg || liveSvg._hasMenu) return;

    liveSvg.addEventListener("contextmenu", (e) => {
        console.log("Contextmenu event fired on", e.target.tagName);
        if (e.ctrlKey) return; // preserve Inspect
        e.preventDefault();
        buildAndShowContextMenu(e);
    });

    liveSvg._hasMenu = true;
    console.log("Contextmenu bound");
}

function bindHideMenu() {
    if (document._hasHide) return;
    document.addEventListener("mousedown", (e) => {
        if (e.button === 0 && e.isTrusted) {
            const contextMenu = document.getElementById("contextMenu");
            if (contextMenu && !contextMenu.contains(e.target)) {
                contextMenu.style.display = "none";
            }
        }
    });
    document._hasHide = true;
}

// =========================
// 5. Context menu dictionary & builder
// =========================
const menuOptions = {
    "0": ["New Process"],
    "1": ["Open", "Add Input", "Add Output", "New Process"],
    "2": ["Open", "New Process"],
    "3": ["New SECI", "Select SECI", "Remove IO"],
    "4": ["Open", "Remove SECI"],
    "5": ["Open", { label: "Add", submenu: ["Add Input", "Add Output"] }]
};

function buildAndShowContextMenu(event) {
    const tnode = event.target.closest("g.node, g.graph, svg");
    console.log("ContextMenu target:", tnode);
    if (tnode) {
        console.log("data-options:", tnode.getAttribute("data-options"));
        console.log("this_type:", tnode.getAttribute("this_type"));
        console.log("this_id:", tnode.getAttribute("this_id"));
    }

    const contextMenu = document.getElementById("contextMenu");
    const menuItems = document.getElementById("menuItems");
    if (!contextMenu || !menuItems) return;

    menuItems.innerHTML = "";
    const node = event.target.closest("g.node, g.graph, svg");
    if (!node) return;

    const this_type = node.getAttribute("this_type");
    const this_id = node.getAttribute("this_id");
    const code = node.getAttribute("data-options") || "0";

    let options = [];
    if (menuOptions && menuOptions[code]) {
        options = menuOptions[code];
    } else {
        try {
            options = JSON.parse(code);
        } catch {
            options = [];
        }
    }
    if (!options || options.length === 0) options = ["Data-Options unresolved"];

    // --- Helper to build Add IO submenus ---
    function buildAddIOSubMenu(option, process_id) {
        const a = top.aras;
        const innovator = a.IomInnovator;

        let cntxt_item = innovator.getItemById("SE Process", process_id);
        const templ_proc = innovator.getItemById(
            "SE Process",
            cntxt_item.getProperty("template_id")
        );

        const source_id = templ_proc.getID();
        const add_type = option === "Add Input" ? "SE Input" : "SE Output";

        let inputs = a.newIOMItem(add_type);
        inputs.setProperty("source_id", source_id);
        inputs.setAttribute("select", "se_io_id");
        let inputs_res = inputs.apply("get");

        const subMenu = document.createElement("ul");
        subMenu.classList.add("sub-menu");

        for (let i = 0; i < inputs_res.getItemCount(); i++) {
            const this_io = inputs_res.getItemByIndex(i);
            const subLi = document.createElement("li");
            const se_io_kn = this_io.getPropertyAttribute("se_io_id", "keyed_name");
            const se_io_id = this_io.getProperty("se_io_id");

            subLi.textContent = se_io_kn;
            subLi.addEventListener("click", () =>
                addInputOutputAction(se_io_id, process_id, add_type)
            );
            subMenu.appendChild(subLi);
        }
        return subMenu;
    }

    // --- Recursive builder (scoped) ---
    const buildMenu = (opts, parentUl) => {
        opts.forEach(opt => {
            const li = document.createElement("li");

            if (typeof opt === "string") {
                li.textContent = opt;

                if (opt === "Add Input" || opt === "Add Output") {
                    const subMenu = buildAddIOSubMenu(opt, this_id);
                    li.appendChild(subMenu);
                } else {
                    li.addEventListener("click", () =>
                        menuAction(opt, node.getAttribute("id"), this_type, this_id)
                    );
                }
                parentUl.appendChild(li);
            } else if (typeof opt === "object" && opt.submenu) {
                li.textContent = opt.label;
                const subUl = document.createElement("ul");
                subUl.classList.add("sub-menu");
                buildMenu(opt.submenu, subUl);
                li.appendChild(subUl);
                parentUl.appendChild(li);
            }
        });
    };

    buildMenu(options, menuItems);

    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
    contextMenu.style.display = "block";
}

// =========================
// 6. Helpers
// =========================
function copySvgAttributes(fromSvg, toSvg) {
    ["width", "height", "viewBox"].forEach(attr => {
        if (fromSvg.hasAttribute(attr)) {
            toSvg.setAttribute(attr, fromSvg.getAttribute(attr));
        }
    });
}

function itemExists(itemType, itemId, select) {
    const a = top.aras;
    let item = a.newIOMItem(itemType);
    item.setID(itemId);
    item.setAttribute("select", select);
    const res = item.apply("get");
    if (!res.isError()) return res;
    else return null;
}

function addInputOutputAction(se_io_id, process_id, add_type) {
    const a = top.aras;
    let this_process = a.newIOMItem("SE Process");
    this_process.setID([process_id]);
    let new_input = a.newIOMItem(add_type, "add");
    new_input.setProperty("se_io_id", se_io_id);
    this_process.addRelationship(new_input);
    this_process = this_process.apply("edit");
    if (this_process.isError()) {
        a.AlertError(this_process);
    } else {
        a.AlertSuccess("Input added.");
        init_refresh();
    }
}

// =========================
// 7. Menu Implementation
// =========================

function menuAction(option, node_id, this_type, this_id) {
    const a = top.aras;
    const svg_id = this_id;

    switch (option) {
        case "Open":
            a.uiShowItem(this_type, this_id, 'tab view', false);
            break;
        case "New Process":
            var params = { aras: a, itemtypeName: 'SE Process', type: 'SearchDialog' };
            var win = a.getMostTopWindowWithAras(window);
            var dialog = win.ArasModules.MaximazableDialog.show('iframe', params);
            var callback = function () {
                const src_id = dialog.returnValue.itemID;
                let src = a.newIOMItem("SE Process");
                src.setID(src_id);
                src.setAttribute('select', 'item_number,name,description,process_type');
                src = src.apply("get");
                //src.fetchRelationships("SE Activity");

                let svg_item = a.newIOMItem("SE Process");
                if (this_type == "First SE Process") { // create required properties from context System
                    const this_system = thisItem;
                    svg_item.setProperty('system_id', this_system.getID());
                    svg_item.setProperty('owned_by_id', this_system.getProperty('owned_by_id'));
                    sys_name = this_system.getProperty('name');
                }
                else { // get select properties from server
                    svg_item.setID(svg_id);
                    svg_item.setAttribute('select', 'owned_by_id,system_id(name)');
                    svg_item = svg_item.apply('get');
                    sys_name = svg_item.getPropertyItem('system_id').getProperty('name');
                }

                let new_item = src.clone(true);
                new_item.setProperty('name', src.getProperty('name'));
                new_item.setProperty('process_type', src.getProperty('process_type'));
                new_item.setProperty('description', src.getProperty('description'));
                new_item.setProperty('template_id', src.getID());
                new_item.setProperty('item_number', sys_name + " " + src.getProperty("item_number"));
                new_item.setProperty('system_id', svg_item.getProperty('system_id'));
                new_item.setProperty('owned_by_id', svg_item.getProperty('owned_by_id'));
                new_item = new_item.apply('add');
                if (new_item.isError()) {
                    a.AlertError(new_item);
                } else {
                    a.AlertSuccess("Process for System created.");
                }
                init_refresh();
            }
            dialog.promise.then(callback);
            break;
        case "Select SECI":
            const add_type = "SE Controlled Item";
            var params = { aras: a, itemtypeName: add_type, type: 'SearchDialog' };
            var win = a.getMostTopWindowWithAras(window);
            var dialog = win.ArasModules.MaximazableDialog.show('iframe', params);
            var callback = function () {
                const seci_id = dialog.returnValue.itemID;
                let svg_item = a.newIOMItem(this_type);
                svg_item.setID(this_id);
                svg_item.setAttribute('select', 'id');
                svg_item = svg_item.apply('get');
                svg_item.setProperty('se_controlled_item_id', seci_id);
                svg_item = svg_item.apply('edit');
                if (svg_item.isError()) {
                    a.AlertError(svg_item);
                } else {
                    init_refresh();
                    a.AlertSuccess("New SECI added to Input/Output.");
                }
            }
            dialog.promise.then(callback);
            break;
        case "New SECI": {
            // Create new SECI Item
            a.newItem("SE Controlled Item").then(function (item) {
                if (item) {
                    // item is XmlNode, and in cache
                    let type = item.getAttribute("type");
                    let seci_id = item.getAttribute("id");
                    var cachedItem = a.itemsCache.getItem(seci_id);
                    // set SECI Properties and save
                    a.setItemProperty(cachedItem, "name", "New " + type);
                    a.setItemProperty(cachedItem, "owned_by_id", "92A21DEE831343FDB7B6E8B7695F48BC");
                    a.saveItemEx(cachedItem, true);

                    // Add SECI to SE IO
                    // this_type and this_id are parameters, this_type should be SE Input Or SE Output
                    let svg_item = a.newIOMItem(this_type);
                    svg_item.setID(this_id);
                    svg_item.setProperty("se_controlled_item_id", seci_id);
                    svg_item = svg_item.apply("edit");
                    if (svg_item.isError()) {
                        a.AlertError(svg_item);
                    } else {
                        init_refresh();
                        a.AlertSuccess("SECI created and added to Input/Output.");
                    }
                }
            });
            break;
        }
        case "Remove SECI": {
            // set seci_id = null if Input/Output exists, this_type, svg_id declared above
            const input_output = ["SE Input", "SE Output"];
            for (const type of input_output) {
                svg_item = itemExists(this_type, svg_id, type);
                if (svg_item) {
                    svg_item.setPropertyAttribute("se_controlled_item_id", "is_null", "1");
                    svg_item = svg_item.apply("edit");
                }
            }
            init_refresh();
            a.AlertSuccess("SECI removed from Input/Output.");
        }
            break;
        case "Remove IO": {
            const confirmText = `Are you sure you want to delete this ${this_type}?`;
            debugger;
            const result = a.confirm(confirmText);
            if (result) { // User clicked OK
                let svg_item = a.newIOMItem(this_type);
                svg_item.setID(this_id);
                const res = svg_item.apply("delete");
                if (res.isError()) {
                    a.AlertError(res);
                } else {
                    init_refresh();
                    a.AlertSuccess(`${this_type} removed.`);
                }
            }
            break;
        }

        default:
    }

    const contextMenu = document.getElementById("contextMenu");
    if (contextMenu) contextMenu.style.display = "none";
}
