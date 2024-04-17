define([
    'kb_lib/props',
    'json!./data/icons.json'
], (
props, 
iconConfig
) => {
    function factory(config) {
        const types = new props.Props({
            data: config.typeDefs
        });

        /**
         * We create an object type config that is a bit more reasonable.
         * {
         *   classNames - Array<string> - icon classes
         *   type - string - kbase or fontAwesome - the type of icon class architecture
         *   color - string - the background color for the icon.
         * }
         */
        const objectTypes = new Set(Object.keys(iconConfig.data).concat(Object.keys(iconConfig.color_mapping)));
        objectTypes.delete('DEFAULT');

        const objectTypeConfig = Array.from(objectTypes.keys()).reduce((objectTypeConfig, typeName) => {
            const typeConfig = {};
            if (typeName in iconConfig.data) {
                typeConfig.classNames = iconConfig.data[typeName][0].split(/\s+/);
            } else {
                typeConfig.classNames = iconConfig.data.DEFAULT[0].split(/\s+/);
            }
            if (typeName in iconConfig.color_mapping) {
                typeConfig.color = iconConfig.color_mapping[typeName];
            } else {
                console.warn('Type without color assigned, defaulting', typeName);
                typeConfig.color = getColor(typeName)
            }
            if (typeConfig.classNames.some((className) => { return className.includes("fa-"); })) {
                typeConfig.type = 'fontAwesome';
            } else {
                typeConfig.type = 'kbase';
            }
            objectTypeConfig[typeName] = typeConfig;
            return objectTypeConfig;
        }, {});

        function getDefaultIcon(typeName) {
            return {
                type: 'fontAwesome',
                classNames: ['fa-file-o'],
                color: getColor(typeName)
            };
        }

        function getIcon(arg) {
            const iconConfig = objectTypeConfig[arg.type.name];
            if (!iconConfig) {
                console.warn(`No icon defined for type ${arg.type.name}, defaulting`);
                return getDefaultIcon(arg.type.name);
            }
            const classNames = iconConfig.classNames.slice();
            switch (iconConfig.type) {
            case 'kbase':
                classNames.push('icon');
                if (arg.size) {
                    switch (arg.size) {
                    case 'small':
                        classNames.push('icon-sm');
                        break;
                    case 'medium':
                        classNames.push('icon-md');
                        break;
                    case 'large':
                        classNames.push('icon-lg');
                        break;
                    }
                }
                break;
            case 'fontAwesome':
                classNames.push('fa');
                break;
            }

            return {
                classNames,
                type: iconConfig.type,
                color: iconConfig.color,
                html: `<span class="${classNames.join(' ')}"></span>`
            };
        }

        function getColor(typeName) {
            let code = 0;
            const colors = iconConfig.colors;

            // TODO: see if this still matches what the Narrative does.
            for (let i = 0; i < typeName.length; i += 1) {
                code += typeName.charCodeAt(i);
            }
            return colors[code % colors.length];
        }

        function hasType(typeQuery) {
            if (types.hasItem(['types', typeQuery.module, typeQuery.name])) {
                return true;
            }
            return false;
        }

        function getViewerById(arg) {
            const viewer = types.getItem(['types', arg.type.module, arg.type.name, 'viewersById', arg.id]);
            if (!viewer) {
                throw new Error(
                    `Viewer not found with this id ${  arg.id  } for ${  arg.type.module  }.${  arg.type.name}`
                );
            }
            return viewer;
        }

        function getViewer(arg) {
            if (arg.id) {
                return getViewerById(arg);
            }
            const viewers = types.getItem(['types', arg.type.module, arg.type.name, 'viewers']);
            if (!viewers || viewers.length === 0) {
                return;
            }
            if (viewers.length === 1) {
                return viewers[0];
            }
            const defaults = viewers.filter((viewer) => {
                if (viewer.default) {
                    return true;
                }
                return false;
            });
            if (defaults.length === 1) {
                const copy = Object.assign({}, defaults[0]);
                delete copy.default;
                return copy;
            }
            if (defaults.length === 0) {
                // If no default viewer, we will choose the first one
                // loaded. This prevents additional widgets from stomping
                // existing ones without cooperation.
                // return viewers[0];
                // throw new Error('No viewer defined for this type');
                // return;
                throw new Error('Multiple viewers defined for this type, but none are set as default');
            }
            throw new Error('Multiple default viewers defined for this type');
        }

        function checkViewers() {
            const modules = types.getItem('types'),
                problems = [];
            if (!modules) {
                return problems;
            }
            Object.keys(modules).forEach((moduleName) => {
                const module = modules[moduleName];
                Object.keys(module).forEach((typeName) => {
                    let type = module[typeName],
                        hasDefault = false;
                    if (!type.viewers) {
                        problems.push({
                            severity: 'warning',
                            type: 'no-viewers',
                            message: `A registered type has no viewers: ${  moduleName  }.${  typeName}`,
                            info: {
                                module: moduleName,
                                type: typeName
                            }
                        });
                        return;
                    }
                    type.viewers.forEach((viewer) => {
                        if (viewer.default) {
                            if (hasDefault) {
                                problems.push({
                                    severity: 'error',
                                    type: 'duplicate-default',
                                    message:
                                        `There is already a default viewer established ${  moduleName  }.${  typeName}`,
                                    info: {
                                        module: moduleName,
                                        type: typeName
                                    }
                                });
                            }
                            hasDefault = true;
                        }
                    });
                    if (!hasDefault) {
                        problems.push({
                            severity: 'error',
                            type: 'no-default',
                            message: `There is no default viewer for this type: ${  moduleName  }.${  typeName}`,
                            info: {
                                module: moduleName,
                                type: typeName
                            }
                        });
                    }
                });
            });

            return problems;
        }

        /**
             * Adds a data vis widget to the runtime types.
             *
             * @function addViewer
             * @param {type} arg
             * @returns {undefined}
             * -
             default: true
             # This the title for the widget
             title: 'Data View 2'
             # This is the module name as specified in the plugin
             # it should follow standard namespacing
             module: kb_widget_dataview_communities_collection
             # This is the internal jquery object name for this widget.
             widget: CollectionView
             # If a bootstrap panel is requested to wrap this widget.
             panel: true
             # Mapping of standard options to the widget option properties.
             # By standard, I mean those defined in the GenericVisualizer widget.
             options:
             -
             from: workspaceId
             to: ws
             -
             from: objectId
             to: id
             -
             from: authToken
             to: token
             */
        function addViewer(type, viewerDef) {
            const typeDef = types.getItem(['types', type.module, type.name]);
            if (typeDef === undefined) {
                types.setItem(['types', type.module, type.name], {
                    viewers: []
                });
            }
            let viewers = types.getItem(['types', type.module, type.name, 'viewers']);
            if (!viewers) {
                viewers = [];
                types.setItem(['types', type.module, type.name, 'viewers'], viewers);
            }
            //                if (viewerDef.default) {
            //                    viewers.forEach(function (viewer) {
            //                        viewer.default = false;
            //                    });
            //                }
            viewers.push(viewerDef);

            // Also, may register by id
            if (viewerDef.id) {
                let byId = types.getItem(['types', type.module, type.name, 'viewersById']);
                if (!byId) {
                    byId = {};
                    types.setItem(['types', type.module, type.name, 'viewersById'], byId);
                }
                if (byId[viewerDef.id]) {
                    throw new Error(`Viewer with this id already registered ${  viewerDef.id}`);
                }
                byId[viewerDef.id] = viewerDef;
            }
        }

        function getDefault(prop) {
            return types.getItem(['defaults', prop]);
        }
        function makeTypeId(type) {
            return `${type.module}.${type.name}-${type.version.major}.${type.version.minor}`;
        }
        function parseTypeId(typeId) {
            const matched = typeId.match(/^(.+?)\.(.+?)-(.+?)\.(.+)$/);
            if (!matched) {
                throw new Error(`Invalid data type ${  typeId}`);
            }
            if (matched.length !== 5) {
                throw new Error(`Invalid data type ${  typeId}`);
            }

            return {
                module: matched[1],
                name: matched[2],
                version: {
                    major: matched[3],
                    minor: matched[4]
                }
            };
        }
        function makeType() {
            if (arguments.length === 1) {
                // make from an object.
                const spec = arguments[0];
                if (spec.version) {
                    const version = spec.version.split('.');
                    return {
                        module: spec.module,
                        name: spec.name,
                        version: {
                            major: version[0],
                            minor: version[1]
                        }
                    };
                }
            }
        }
        function makeVersion(type) {
            return `${type.version.major  }.${  type.version.minor}`;
        }

        return Object.freeze({
            getIcon,
            getViewer,
            getDefault,
            makeTypeId,
            parseTypeId,
            makeType,
            makeVersion,
            addViewer,
            hasType,
            checkViewers
        });
    }

    return {
        make(config) {
            return factory(config);
        }
    };
});
