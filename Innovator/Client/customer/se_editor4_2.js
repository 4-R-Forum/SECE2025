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

  // --- 3a. Fetch SVG string from server ---
  thisItem = parent.thisItem;
  const svgString = thisItem.apply("SystemReportServer").getResult();

  // --- 3a.1 Set data-options and this_id, this_type attributes ---
  // Parse the string into a DOM structure
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(svgString, "image/svg+xml");
    const this_type = thisItem.getType();
    const this_id = thisItem.getID();

    // Select all elements with the "node" attribute
    xmlDoc.querySelectorAll(".node").forEach(el => {
        // set attributes for se_editor, type, id, options for menu
        let this_xid = el.childNodes[0];
        let this_id = this_xid.textContent.replace("x", "");
        let this_type = "SE Controlled Item";
        let seci = thisItem.newItem("SE Process");
        seci.setID(this_id);
        seci.setAttribute("select", "id");
        let res = seci.apply("get");
        if (!res.isError()) {
            this_type = "SE Process";
            el.setAttribute("data-options", "[\"Open\", \"Add Input\",\"Add Output\",  \"New Process\"]");
        }
        else {
            el.setAttribute("data-options", "[\"Open\", \"Set SE Controlled Item\"]");
        };
        el.setAttribute("this_type", this_type);
        el.setAttribute("this_id", this_id);
    });

    // Serialize it back to string
    const serializer = new XMLSerializer();
    const newSvgString = serializer.serializeToString(xmlDoc);

  // --- 3b. Parse into DOM ---
  const doc = parser.parseFromString(newSvgString, "image/svg+xml");
  const newSvg = doc.documentElement; // parsed <svg>
  const newGraph0 = newSvg.querySelector("#graph0");

  // --- 3c. Update live DOM ---
  const liveSvg = document.getElementById("se_svg");
  const graphMain = liveSvg.querySelector("#graphmain");

  copySvgAttributes(newSvg, liveSvg);

  if (newGraph0 && graphMain) {
    graphMain.innerHTML = "";
    graphMain.appendChild(newGraph0);
  } else {
    console.error("graph0 or graphmain missing");
  }

  // --- 3d. Bind interactions ---
  bindPanzoom(graphMain);
  bindContextMenu(liveSvg);

  // --- 3e. Fade-in effect ---
  graphMain.style.opacity = "0.001";
  requestAnimationFrame(() => {
    graphMain.getBBox();
    graphMain.style.opacity = "1";
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
    beforeMouseDown: (e) => e.button === 0 // only left mouse
  });
  area._hasPanzoom = true;
  console.log("Panzoom bound");
}

function bindContextMenu(liveSvg) {
  if (!liveSvg || liveSvg._hasMenu) return;
  liveSvg.addEventListener("contextmenu", (event) => {
    console.log("SVG contextmenu fired", event.target);
    event.preventDefault();
    event.stopImmediatePropagation();
    buildAndShowContextMenu(event);
  }, true);
  liveSvg._hasMenu = true;
  console.log("Contextmenu bound");
}

function bindHideMenu() {
  if (document._hasHide) return;
  document.addEventListener("mousedown", (e) => {
    console.log("doc mousedown", e.button, e.target, e.isTrusted);
    if (e.button === 0 && e.isTrusted) { // left only
      const contextMenu = document.getElementById("contextMenu");
      if (contextMenu && !contextMenu.contains(e.target)) {
        contextMenu.style.display = "none";
      }
    }
  });
  document._hasHide = true;
  console.log("HideMenu bound");
}

// =========================
// 5. Context menu builder
// =========================
function buildAndShowContextMenu(event) {
  const contextMenu = document.getElementById("contextMenu");
  const menuItems = document.getElementById("menuItems");
  if (!contextMenu || !menuItems) return;

  menuItems.innerHTML = "";

  // Walk up from polygon/text to the node group
  const node = event.target.closest("g.node, g.graph");
  if (!node) {
    console.warn("No node element found for contextmenu");
    return;
  }

  const options = JSON.parse(node.getAttribute("data-options") || "[]");
  options.forEach(opt => {
    const li = document.createElement("li");
    li.textContent = opt;
    li.addEventListener("click", () => {
      menuAction(opt, node.getAttribute("this_type"), node.getAttribute("this_id"));
    });
    menuItems.appendChild(li);
  });

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

function menuAction(option, this_type, this_id) {
    const a = top.aras;
    const innovator = a.IomInnovator
    const svg_id = this_id;
    /*
        We have been unable to find a way to reproduce the behavior of client onSearhDialog events, they may use DoJo.
        As an alternative a sub-menu is used in the context menu, following suggestion from ChatGPT.
        In our case we know from this_type what was clicked. If it is SE Process,
        and the option is Add Input or Output, we can get the SE IO items for the template
        to populate the sub menu in the addInput nested function.
        Each menu item has its own event listener  setup by init_contextmenu, called by a timeout
        when the page loads. 
    */
        switch (option) {
        case "Open":
            a.uiShowItem(this_type, this_id, 'tab view', false);
            break;
        case "New Process":
            var params = {
                aras: a,
                itemtypeName: 'SE Process',
                type: 'SearchDialog'
            };
            var win = a.getMostTopWindowWithAras(window);
            var dialog = win.ArasModules.MaximazableDialog.show(
                'iframe',
                params
            );              
            var callback = function() {
                //Perform logic using dialog result here
                // dialog.returnValue is javacript object with properties item, itemId, keyed_name
                // item is an xml Node which the client Aras object uses rather than IOM Item
                const src_id = dialog.returnValue.itemID;
                // get item selected in dialog from server
                let src = a.newIOMItem("SE Process");
                src.setID(src_id);
                src.setAttribute('select','item_number,name,description,process_type');
                src = src.apply("get");
                src.fetchRelationships("SE Activity");
                // get item clicked in svg from server to get name
                let svg_item = a.newIOMItem("SE Process");
                svg_item.setID(svg_id);
                svg_item.setAttribute('select','owned_by_id,system_id(name)');
                svg_item=svg_item.apply('get');
                const sys_name = svg_item.getPropertyItem('system_id').getProperty('name');
                // clone the source process, updagte properties, save and open the result
                let new_item = src.clone(true);
                new_item.setProperty('name',src.getProperty('name'));
                new_item.setProperty('process_type',src.getProperty('process_type'));
                new_item.setProperty('description',src.getProperty('description'));
                new_item.setProperty('template_id', src.getID());
                new_item.setProperty('item_number',sys_name + " " + src.getProperty("item_number"));
                new_item.setProperty('system_id',svg_item.getProperty('system_id'));
                new_item.setProperty('owned_by_id', svg_item.getProperty('owned_by_id'));
                new_item = new_item.apply('add');
                // a.uiShowItemEx(new_item.node);
                if (new_item.isError()) {
                    a.AlertError(new_item); 
                } else { 
                    a.AlertSuccess("Process for System created."); 
                }                
            }
            dialog.promise.then(callback);
            break;
        case "Set SE Controlled Item":
            const add_type = "SE Controlled Item";
            var params = {
                aras: a,
                itemtypeName: add_type,
                type: 'SearchDialog'
            };
            var win = a.getMostTopWindowWithAras(window);
            var dialog = win.ArasModules.MaximazableDialog.show(
                'iframe',
                params
            );              
            var callback = function() {
                debugger;
                //Perform logic using dialog result here
                // dialog.returnValue is javacript object with properties item, itemId, keyed_name
                // item is an xml Node which the client Aras object uses rather than IOM Item
                const seci_id = dialog.returnValue.itemID; // all we need is the ID, its a SECI
                // get item clicked in svg from server so that we can add a Property
                // this_type and this_id are in scope
                // it must exist because it was in the diagram
                let svg_item = a.newIOMItem(this_type);
                svg_item.setID(this_id);
                svg_item.setAttribute('select','id'); // all we need is the id of the input or output
                svg_item = svg_item.apply('get');
                // edit the svg_item to add the selected seio_id
                svg_item.setProperty('seio_id',seci_id);
                svg_item = svg_item.apply('edit');
                // a.uiShowItemEx(new_item.node);
                if (svg_item.isError()) {
                    a.AlertError(svg_item); 
                } else { 
                    a.AlertSuccess("SE Controlled Item Set."); 
                }                
            }
            dialog.promise.then(callback);
            break;                                   
        default:
            // alert(`Selected: ${option} for ${currentTarget.id}`);
    }

    contextMenu.style.display = "none";
}

