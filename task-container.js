/*
 * Copyright (C) 2020 The ToastHub Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use-strict';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import * as taskActions from './task-actions';
import fuLogger from '../../core/common/fu-logger';
import TaskView from '../../memberView/pm_task/task-view';
import TaskModifyView from '../../memberView/pm_task/task-modify-view';
import utils from '../../core/common/utils';
import moment from 'moment';


class PMTaskContainer extends Component {
	constructor(props) {
		super(props);
		this.state = {pageName:"PM_TASK",isDeleteModalOpen: false, errors:null, warns:null, successes:null};
	}

	componentDidMount() {
		if (this.props.history.location.state != null && this.props.history.location.state.parent != null) {
			this.props.actions.init({parent:this.props.history.location.state.parent,parentType:this.props.history.location.state.parentType});
		} else {
			this.props.actions.init({});
		}
	}

	onListLimitChange = (fieldName, event) => {
		let value = 20;
		if (this.props.codeType === 'NATIVE') {
			value = event.nativeEvent.text;
		} else {
			value = event.target.value;
		}

		let listLimit = parseInt(value);
		this.props.actions.listLimit({state:this.props.pmtask,listLimit});
	}

	onPaginationClick = (value) => {
		fuLogger.log({level:'TRACE',loc:'TaskContainer::onPaginationClick',msg:"fieldName "+ value});
		let listStart = this.props.pmtask.listStart;
		let segmentValue = 1;
		let oldValue = 1;
		if (this.state["PM_TASK_PAGINATION"] != null && this.state["PM_TASK_PAGINATION"] != ""){
			oldValue = this.state["PM_TASK_PAGINATION"];
		}
		if (value === "prev") {
			segmentValue = oldValue - 1;
		} else if (value === "next") {
			segmentValue = oldValue + 1;
		} else {
			segmentValue = value;
		}
		listStart = ((segmentValue - 1) * this.props.pmtask.listLimit);
		this.setState({"PM_TASK_PAGINATION":segmentValue});
		
		this.props.actions.list({state:this.props.pmtask,listStart});
	}

	onSearchChange = (fieldName, event) => {
		if (event.type === 'keypress') {
			if (event.key === 'Enter') {
				this.searchClick(fieldName,event);
			}
		} else {
			if (this.props.codeType === 'NATIVE') {
				this.setState({[fieldName]:event.nativeEvent.text});
			} else {
				this.setState({[fieldName]:event.target.value});
			}
		}
	}

	onSearchClick = (fieldName, event) => {
		let searchCriteria = [];
		if (fieldName === 'PM_TASK-SEARCHBY') {
			if (event != null) {
				for (let o = 0; o < event.length; o++) {
					let option = {};
					option.searchValue = this.state['PM_TASK-SEARCH'];
					option.searchColumn = event[o].value;
					searchCriteria.push(option);
				}
			}
		} else {
			for (let i = 0; i < this.props.pmtask.searchCriteria.length; i++) {
				let option = {};
				option.searchValue = this.state['PM_TASK-SEARCH'];
				option.searchColumn = this.props.pmtask.searchCriteria[i].searchColumn;
				searchCriteria.push(option);
			}
		}

		this.props.actions.search({state:this.props.pmtask,searchCriteria});
	}
	
	onOrderBy = (selectedOption, event) => {
		fuLogger.log({level:'TRACE',loc:'TaskContainer::onOrderBy',msg:"id " + selectedOption});
		let orderCriteria = [];
		if (event != null) {
			for (let o = 0; o < event.length; o++) {
				let option = {};
				if (event[o].label.includes("ASC")) {
					option.orderColumn = event[o].value;
					option.orderDir = "ASC";
				} else if (event[o].label.includes("DESC")){
					option.orderColumn = event[o].value;
					option.orderDir = "DESC";
				} else {
					option.orderColumn = event[o].value;
				}
				orderCriteria.push(option);
			}
		} else {
			let option = {orderColumn:"PM_TASK_TABLE_NAME",orderDir:"ASC"};
			orderCriteria.push(option);
		}
		this.props.actions.orderBy({state:this.props.pmtask,orderCriteria});
	}
	
	onSave = () => {
		fuLogger.log({level:'TRACE',loc:'TaskContainer::onSave',msg:"test"});
		let errors = utils.validateFormFields(this.props.pmtask.prefForms.PM_TASK_FORM,this.props.pmtask.inputFields);
		
		if (errors.isValid){
			this.props.actions.saveItem({state:this.props.pmtask});
		} else {
			this.setState({errors:errors.errorMap});
		}
	}
	
	onModify = (item) => {
		let id = null;
		if (item != null && item.id != null) {
			id = item.id;
		}
		fuLogger.log({level:'TRACE',loc:'TaskContainer::onModify',msg:"test"+id});
		this.props.actions.modifyItem({id,appPrefs:this.props.appPrefs});
	}
	
	onDelete = (item) => {
		fuLogger.log({level:'TRACE',loc:'TaskContainer::onDelete',msg:"test"});
		this.setState({isDeleteModalOpen:false});
		if (item != null && item.id != "") {
			this.props.actions.deleteItem({state:this.props.pmtask,id:item.id});
		}
	}
	
	openDeleteModal = (item) => {
		this.setState({isDeleteModalOpen:true,selected:item});
	}
	
	onOption = (code, item) => {
		fuLogger.log({level:'TRACE',loc:'TaskContainer::onOption',msg:" code "+code});
		switch(code) {
			case 'MODIFY': {
				this.onModify(item);
				break;
			}
			case 'DELETE': {
				this.openDeleteModal(item);
				break;
			}
			case 'DELETEFINAL': {
				this.onDelete(item);
				break;
			}
			case 'COMMENT': {
				this.props.history.push({pathname:'/pm-comment',state:{parent:item,parentType:"TASK"}});
				break;
			}
		}
	}
	
	closeModal = () => {
		this.setState({isDeleteModalOpen:false,errors:null,warns:null});
	}
	
	onCancel = () => {
		fuLogger.log({level:'TRACE',loc:'TaskContainer::onCancel',msg:"test"});
		this.props.actions.list({state:this.props.pmtask});
	}
	
	inputChange = (fieldName,switchValue,event) => {
		let value = "";
		if (switchValue === "DATE") {
			value = event.toISOString();
		} else {
			value = switchValue;
		}
		utils.inputChange(this.props,fieldName,value);
	}
	
	onBlur = (field) => {
		fuLogger.log({level:'TRACE',loc:'TaskContainer::onBlur',msg:field.name});
		let fieldName = field.name;
		// get field and check what to do
		if (field.optionalParams != ""){
			let optionalParams = JSON.parse(field.optionalParams);
			if (optionalParams.onBlur != null) {
				if (optionalParams.onBlur.validation != null && optionalParams.onBlur.validation == "matchField") {
					if (field.validation != "") {
						let validation = JSON.parse(field.validation);
						if (validation[optionalParams.onBlur.validation] != null && validation[optionalParams.onBlur.validation].id != null){
							if (this.props.pmtask.inputFields[validation[optionalParams.onBlur.validation].id] == this.props.pmtask.inputFields[fieldName]) {
								if (validation[optionalParams.onBlur.validation].successMsg != null) {
									let successMap = this.state.successes;
									if (successMap == null){
										successMap = {};
									}
									successMap[fieldName] = validation[optionalParams.onBlur.validation].successMsg;
									this.setState({successes:successMap, errors:null});
								}
							} else {
								if (validation[optionalParams.onBlur.validation].failMsg != null) {
									let errorMap = this.state.errors;
									if (errorMap == null){
										errorMap = {};
									}
									errorMap[fieldName] = validation[optionalParams.onBlur.validation].failMsg;
									this.setState({errors:errorMap, successes:null});
								}
							}
						}
					}
				} else if (optionalParams.onBlur.func != null) {
					
				}
			}
		}
	}
	
	goBack = () => {
		fuLogger.log({level:'TRACE',loc:'ReleaseContainer::goBack',msg:"test"});
		this.props.history.goBack();
	}

	render() {
		fuLogger.log({level:'TRACE',loc:'TaskContainer::render',msg:"Hi there"});
		if (this.props.pmtask.isModifyOpen) {
			return (
				<TaskModifyView
				containerState={this.state}
				item={this.props.pmtask.selected}
				inputFields={this.props.pmtask.inputFields}
				appPrefs={this.props.appPrefs}
				itemPrefForms={this.props.pmtask.prefForms}
				onSave={this.onSave}
				onCancel={this.onCancel}
				onReturn={this.onCancel}
				inputChange={this.inputChange}
				onBlur={this.onBlur}/>
			);
		} else if (this.props.pmtask.items != null) {
			return (
				<TaskView
				containerState={this.state}
				itemState={this.props.pmtask}
				appPrefs={this.props.appPrefs}
				onListLimitChange={this.onListLimitChange}
				onSearchChange={this.onSearchChange}
				onSearchClick={this.onSearchClick}
				onPaginationClick={this.onPaginationClick}
				onOrderBy={this.onOrderBy}
				closeModal={this.closeModal}
				onOption={this.onOption}
				inputChange={this.inputChange}
				goBack={this.goBack}
				session={this.props.session}
				/>
			);
		} else {
			return (<div> Loading... </div>);
		}
	}
}

PMTaskContainer.propTypes = {
	appPrefs: PropTypes.object,
	actions: PropTypes.object,
	pmtask: PropTypes.object,
	session: PropTypes.object
};

function mapStateToProps(state, ownProps) {
  return {appPrefs:state.appPrefs, pmtask:state.pmtask, session:state.session};
}

function mapDispatchToProps(dispatch) {
  return { actions:bindActionCreators(taskActions,dispatch) };
}

export default connect(mapStateToProps,mapDispatchToProps)(PMTaskContainer);
