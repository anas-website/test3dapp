import {STORAGE_GLOBAL_PREFIX} from '../projectPlugin';

const EXTENSIONS_STORAGE_PREFIX = `${STORAGE_GLOBAL_PREFIX}.Extensions`;

let extensions = [];

export function activate(ctx) {
  let {services} = ctx;
  let extensionsStr = services.storage.get(EXTENSIONS_STORAGE_PREFIX);
  if (extensionsStr) {
    extensions = JSON.parse(extensionsStr);
  }
  
  function registerExtension(id, url){
    extensions.push({id, url});
    services.storage.set(EXTENSIONS_STORAGE_PREFIX, JSON.stringify(extensions));
    loadExtension(extensions[extensions.length - 1]);
  }

  function extensionReady(id, activate) {
    let extension = extensions.find(e => e.id === id);
    if (!extension) {
      console.warn(`extension "${id}" not registered`);
    } else {
      extension.activate = activate;
      console.info(`extension "${id}" is ready`);
    }
    services.lifecycle.loadProjectRequest();
  }
  
  function allExtensionsReady() {
    for (let e of extensions) {
      if (e.activate === NO_OP) {
        return false;
      }
    }
    return true;
  }
  
  function activateAllExtensions() {
    for (let e of extensions) {
      e.activate(ctx);
    }
  }
  
  services.extension = {
    registerExtension,
    allExtensions: extensions,
    extensionReady,
    allExtensionsReady,
    activateAllExtensions
  };

  extensions.forEach(e => e.activate = NO_OP);
  extensions.forEach(loadExtension);
}

function loadExtension({id, url}) {
  console.info(`starting extension "${id}"...`);

  let extensionScript = document.createElement('script');
  extensionScript.setAttribute('src', url);
  document.head.appendChild(extensionScript);
}

const NO_OP = () => null;