var client = new Dropbox.Client({ key: "ob9346e5yc509q2" });
//client.authDriver(new Dropbox.AuthDriver.Popup({receiverUrl: "https://s9w.github.io/ginseng/dropbox_receiver.html"}));
client.authDriver(new Dropbox.AuthDriver.Popup({receiverUrl: "https://leastaction.org/ginseng/dropbox_receiver.html"}));


var App = React.createClass({
    getInitialState: function() {
        return {
            infos: init_data.infos,
            infoTypes: init_data.infoTypes,
            ginseng_settings: init_data.settings,
            activeMode: "status",
            selectedInfoIndex: 0,
            dropBoxStatus: "off",
            lastSaved: "never"
        };
    },
    clickNav: function(mode) {
        this.setState({activeMode: mode});
    },
    authDB: function(event){
        var thisApp = this;
        client.authenticate(function (error) {
            if (error) {
                thisApp.setState({dropBoxStatus: "ERROR"});
            }
            else {
                thisApp.setState({dropBoxStatus: "logged in!"});
            }
        });
    },
    saveDB: function(){
        var thisApp = this;
        var writeData = {
            infos: this.state.infos,
            infoTypes: this.state.infoTypes,
            settings: this.state.ginseng_settings
        };
        client.writeFile("ginseng_data.txt", JSON.stringify(writeData, null, '\t'), function(error, stat) {
            if (error) {
                console.log("error: " + error);
            }
            else {
                console.log("file saved with revision " + stat.versionTag);
                thisApp.setState({lastSaved: moment().format("LTS")});
            }
        });
    },
    loadDB: function() {
        var thisApp = this;
        client.readFile("ginseng_data.txt", function (error, data) {
            if (error) {
                return showError(error);  // Something went wrong.
            }
            var js = JSON.parse(data);
            thisApp.setState({
                infos: js.infos,
                infoTypes: js.infoTypes,
                ginseng_settings: js.settings
            });
        });

    },
    getSortedInfos: function(infos, sortField){
        // Sort infos based on value of first entry.
        var infos_sorted = JSON.parse( JSON.stringify( infos ));
        infos_sorted = infos_sorted.sort(function(a, b){
            return a.fields[0].localeCompare(b.fields[0])
        });
        return infos_sorted;
    },
    onRowSelect: function(index_selected) {
        this.setState({
            selectedInfoIndex: index_selected,
            activeMode: "edit"
        });
    },


    onInfoEdit: function(newInfo) {
        var newInfos = this.state.infos.slice();
        newInfos[this.state.selectedInfoIndex] = newInfo;

        //var updIndex = 0;
        //var newInfos = React.addons.update(this.state.infos, {
        //    updIndex: {$set: newInfo}
        //});
        this.setState({
            infos: newInfos,
            activeMode: "browse"
        } );
    },
    onInfoDelete: function(){
        var newInfos = JSON.parse( JSON.stringify( this.state.infos ));
        console.log("ondelete, this.state.selectedInfoIndex: " + this.state.selectedInfoIndex);
        newInfos.splice(this.state.selectedInfoIndex, 1);
        this.setState({
            infos: newInfos,
            activeMode: "browse"
        } );
    },
    addInfo: function(newInfo){
        var newInfo_copy = JSON.parse( JSON.stringify( newInfo ));
        var newInfos = JSON.parse( JSON.stringify( this.state.infos ));
        newInfos.push(newInfo_copy);

        var new_settings = JSON.parse( JSON.stringify( this.state.ginseng_settings ));
        this.setState( {
            infos: newInfos,
            ginseng_settings: new_settings,
            activeMode: "browse"
        } );
    },
    //getITypeIndex: function(types, nameS){
    //    for(var i = 0; i < types.length; i += 1) {
    //        if(types[i].name === nameS) {
    //            return i;
    //        }
    //    }
    //},
    //onTypesEdit: function(newTypes){
    //    var newTypes_copy = JSON.parse( JSON.stringify( newTypes ));
    //    this.setState({infoTypes: newTypes_copy} );
    //},
    //onTypeResize: function(selectedTypeIndex, fieldNameIndex){
    //    var new_infos = JSON.parse( JSON.stringify( this.state.infos ));
    //    for (var infoIdx = 0; infoIdx < new_infos.length; ++infoIdx) {
    //        if(new_infos[infoIdx].type === this.state.infoTypes[selectedTypeIndex].name){
    //            if(fieldNameIndex === -1){
    //                new_infos[infoIdx].fields.push("");
    //            }else{
    //                new_infos[infoIdx].fields.splice(fieldNameIndex, 1);
    //            }
    //        }
    //    }
    //    var new_types = JSON.parse( JSON.stringify( this.state.infoTypes ));
    //    if(fieldNameIndex === -1){
    //        new_types[selectedTypeIndex].fieldNames.push("");
    //    }else{
    //        new_types[selectedTypeIndex].fieldNames.splice(fieldNameIndex, 1);
    //    }
    //
    //    this.setState({
    //        infos: new_infos,
    //        infoTypes: new_types
    //    });
    //},
    //onTypeNameEdit: function(typeName, newTypeName){
    //    var newInfos = JSON.parse( JSON.stringify( this.state.infos ));
    //    for (var index = 0; index < newInfos.length; ++index) {
    //        if(newInfos[index].type === typeName){
    //            newInfos[index].type = newTypeName;
    //        }
    //    }
    //    var newInfoTypes = JSON.parse( JSON.stringify( this.state.infoTypes ));
    //    newInfoTypes[this.getITypeIndex(newInfoTypes, typeName)].name = newTypeName;
    //    this.setState({
    //        infoTypes: newInfoTypes,
    //        infos: newInfos
    //    });
    //},
    applyInterval: function(infoIndex, reviewIndex, newInterval){
        var newInfos = JSON.parse( JSON.stringify( this.state.infos ));
        newInfos[infoIndex].reviews[reviewIndex].push({
            "reviewTime": moment().format(),
            "dueTime": moment().add(moment.duration(newInterval)).format()
        });
        this.setState( {
            infos: newInfos
        } );
    },
    filterInfo: function(filterStr, info){
        if(filterStr===""){
            return true
        }
        var filterStrNew = filterStr.replace(/ /g, "");
        var filters = filterStrNew.split(",");
        for (var i = 0; i < filters.length; ++i) {
            if(filters[i] === ""){
                console.log("   empty?");
            }
            else if(filters[i] === "tag:reverse"){
                if(info.tags.indexOf("reverse") === -1){
                    return false;
                }
            }else{
                console.log("other filter, eek");
            }
        }
        return true;
    },
    render: function () {
        React.addons.Perf.start();
        // get used Tags
        var usedTags = [];
        for (var i = 0; i < this.state.infos.length; ++i) {
            for (var j = 0; j < this.state.infos[i].tags.length; ++j) {
                if(usedTags.indexOf(this.state.infos[i].tags[j]) === -1){
                    usedTags.push( this.state.infos[i].tags[j] );
                }
            }
        }


        // general helper
        var typeNames = {}; // = this.state.infoTypes.map(function(type){ return type.name;});
        for(var key in this.state.infoTypes){
            typeNames[key] = this.state.infoTypes[key].name;
        }

        // Edit / New
        var compEdit = <div/>;
        if(["new", "edit"].indexOf(this.state.activeMode) !== -1){
            var editInfo, onSave, onDelete, saveButtonStr;
            if (this.state.activeMode == "new") {
                editInfo = {typeID: this.state.infos[this.state.infos.length-1].typeID};
                onSave = this.addInfo;
                onDelete = false;
                saveButtonStr = "add";
            }
            else {
                editInfo = this.state.infos[this.state.selectedInfoIndex];
                onSave = this.onInfoEdit;
                onDelete = this.onInfoDelete;
                saveButtonStr = "save";
            }

            compEdit = <InfoEdit
                typeNames={typeNames}
                //fieldNames={this.state.ginseng_infoTypes[this.getITypeIndex(this.state.ginseng_infoTypes, editInfo.type)].fieldNames}
                types={this.state.infoTypes}
                info={editInfo}
                saveButtonStr={saveButtonStr}

                usedTags={usedTags}
                onSave={onSave}
                cancelEdit={this.clickNav.bind(this, "browse")}
                onDelete={onDelete}
            />
        }

        // Info browser
        var compBrowser = <div/>;
        if(this.state.activeMode === "browse"){
            compBrowser = <InfoBrowser
                infos={this.state.infos}
                typeNames={typeNames}
                onRowSelect={this.onRowSelect}
                onNew={this.clickNav.bind(this, "new")}
                selections={this.state.ginseng_selections}
            />
        }

        // Review
        var comp_review = <div/>;
        if(this.state.activeMode === "review") {
            var thisApp = this;
            (function() {
                var dueItems = [];
                var infoIndex, reviewIndex, info;
                var filteredInfos = thisApp.state.infos;
                var urgency;
                for (infoIndex = 0; infoIndex < filteredInfos.length; ++infoIndex) {
                    info = filteredInfos[infoIndex];
                    for (reviewIndex = 0; reviewIndex < info.reviews.length; ++reviewIndex) {
                        if( !(thisApp.filterInfo(thisApp.state.infoTypes[info.typeID].views[reviewIndex].condition, info))){
                            console.log("out due filter: " + info.fields[0].slice(0,10) + ", reviewIndex: " + reviewIndex);
                            continue;
                        }
                        if(info.reviews[reviewIndex].length > 0) {
                            var lastDueTimeStr = info.reviews[reviewIndex][info.reviews[reviewIndex].length - 1].dueTime;
                            var lastReviewTimeStr = info.reviews[reviewIndex][info.reviews[reviewIndex].length - 1].reviewTime;
                            var plannedIntervalMs = moment(lastDueTimeStr).diff(moment(lastReviewTimeStr));
                            var actualIntervalMs = moment().diff(moment(lastReviewTimeStr));
                            urgency = actualIntervalMs/plannedIntervalMs;
                            if( urgency>=1.0 ){
                                console.log("in due urgency: " + info.fields[0].slice(0,10) + ", reviewIndex: " + reviewIndex + ", urgency: " + urgency);
                                dueItems.push([actualIntervalMs, infoIndex, reviewIndex, urgency]);
                            }else{
                                console.log("out due urgency: " + info.fields[0].slice(0,10) + ", reviewIndex: " + reviewIndex + ", urgency: " + urgency);
                            }
                        }else{
                            dueItems.push([0, infoIndex, reviewIndex, 1.1]);
                            console.log("in because new: " + info.fields[0].slice(0,10) + ", reviewIndex: " + reviewIndex);
                        }
                    }                    
                }

                var dueCount = dueItems.length;
                if(dueCount >0) {
                    // find next due item
                    var winnerActualInterval = 0;
                    var winnerUrgency = 0;
                    var nextInfoIndex = 0;
                    var nextReviewIndex = 0;
                    for (index = 0; index < dueItems.length; ++index) {
                        if (dueItems[index][3] >= winnerUrgency) {
                            winnerActualInterval = dueItems[index][0];
                            nextInfoIndex = dueItems[index][1];
                            nextReviewIndex = dueItems[index][2];
                            winnerUrgency = dueItems[index][3];
                        }
                    }
                    var nextTypeID = thisApp.state.infos[nextInfoIndex].typeID;

                    comp_review = <Review
                        applyInterval={thisApp.applyInterval.bind(thisApp, nextInfoIndex, nextReviewIndex)}
                        frontStr={
                            thisApp.state.infoTypes[nextTypeID].views[nextReviewIndex].front.replace(
                                /{(\w*)}/g, function(match, p1){
                                    return thisApp.state.infos[nextInfoIndex].fields[ thisApp.state.infoTypes[nextTypeID].fieldNames.indexOf(p1) ];
                                })
                            }
                        backStr={
                            thisApp.state.infoTypes[nextTypeID].views[nextReviewIndex].back.replace(
                                /{(\w*)}/g, function(match, p1){
                                    return thisApp.state.infos[nextInfoIndex].fields[ thisApp.state.infoTypes[nextTypeID].fieldNames.indexOf(p1) ];
                                })
                            }
                        dueCount={dueCount}
                        reviewInterval={winnerActualInterval}
                        timeIntervalChoices={thisApp.state.ginseng_settings.timeIntervalChoices}
                    />;
                }
            })();
        }

        // Types
        var compTypes = false;
        if(this.state.activeMode=="types"){
            compTypes = <InfoTypes
                infoTypes={this.state.infoTypes}
                onNameEdit={this.onTypeNameEdit}
                onEdit={this.onTypesEdit}
                onResize={this.onTypeResize}
            />;
        }
        React.addons.Perf.stop();
        React.addons.Perf.printInclusive();
        return (
            <div className="app">
                <div className="navBar">
                    <div
                        className={this.state.activeMode == "status" ? "active" : "inactive"}
                        onClick={this.clickNav.bind(this, "status")}>Status
                    </div>
                    <div className={this.state.activeMode === "browse" ? "active" : "inactive" }
                        onClick={this.clickNav.bind(this, "browse")}>Infos
                    </div>
                    <div className={this.state.activeMode == "types" ? "active" : "inactive"}
                        onClick={this.clickNav.bind(this, "types")}>Types
                    </div>
                    <div className={this.state.activeMode == "review" ? "active" : "inactive"}
                        onClick={this.clickNav.bind(this, "review")}>Review
                    </div>
                </div>

                {compEdit}
                <Status      show={this.state.activeMode=="status"}
                    infoCount={this.state.infos.length} dropBoxStatus={this.state.dropBoxStatus} onDBAuth={this.authDB}
                    onDbSave={this.saveDB} lastSaved={this.state.lastSaved} onDbLoad={this.loadDB}/>
                {compBrowser}
                {compTypes}
                {comp_review}

            </div>);
            }

});

var Status = React.createClass({
    render: function() {
        if(this.props.show) {
//            var blob = new Blob([JSON.stringify(this.props.gData, null, '\t')], {type: "application/json"});
//            var url  = URL.createObjectURL(blob);
////...
//            <a download="ginseng.json" href={url}>download JSON</a>

            return (
                <div className="Status Component">
                    <div>Infos loaded: {this.props.infoCount}</div>
                    <div>Dropbox Status: {this.props.dropBoxStatus}</div>
                    <div>Last save: {this.props.lastSaved} (local time)</div>

                    <div>

                    </div>
                    <div className={"flexContHoriz"}>
                        <span className={"button buttonGood "+(this.props.dropBoxStatus === "logged in!"?"disabled":"")} onClick={this.props.onDBAuth}>auth Dropbox</span>
                        <span className={"button " + (this.props.dropBoxStatus === "logged in!"?"":"invisible")} onClick={this.props.onDbLoad}>load from Dropbox</span>
                        <span className={"button " + (this.props.dropBoxStatus === "logged in!"?"":"invisible")} onClick={this.props.onDbSave}>save to Dropbox</span>
                    </div>
                </div>
            ) } else{
            return(
                <div className="Status Component"></div>
        )} } });


React.render(
    <App />, document.getElementById('content')
);