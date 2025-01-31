import React from 'react';
import firebase from './firebase.js';
import script from './Script.js';
import {Button, TextBox} from './Common.js';

class Moderator extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			passwordCorrect: false,
			attemptedPassword: false,
			areYouSure: false
		};
	}
	handleContinueButton = (id) => {
		script.continue(this.props.settings.performanceId, this.props.performance);
	}
	handlePickSpecificButton = (idx)=>{
		script.pickChoice(idx, this.props.settings.performanceId);
	}
	handlePickButton = (id) => {
		let pickMe = 0;
		const choices = Object.values(this.props.performance.choices);
		choices.forEach((item, index) => {
			if (item.votes > this.props.performance.choices[pickMe].votes) {
				pickMe = index;
			}
		});
		script.pickChoice(pickMe, this.props.settings.performanceId);
	}
	handleRantButton = (id) => {
		firebase.database().ref(this.props.settings.performanceId+'/rants').set(null);
	}
	handleRestartButton = (id) => {
		if (this.state.areYouSure) {
			firebase.database().ref(this.props.settings.performanceId).set("restarting");
			script.startOver(this.props.settings.performanceId);
			this.handleBackButton(id);
		} else {
			this.setState({areYouSure: true});
		}
	}
	handlePassword = (value) => {
		if (value === this.props.settings.modPassword) {
			this.setState({passwordCorrect: true});
			script.initPerformance(this.props.performance, this.props.settings.performanceId);
		}
		this.setState({attemptedPassword: true});
	}
	handleBackButton = (id) => {
		if (this.state.areYouSure) {
			this.setState({areYouSure: false});
		}
	}
	truncateString(str, num) {
		if (str.length > num) {
			return str.slice(0, num) + "...";
		} else {
			return str;
		}
	}
	componentWillUnmount() {
		this.setState = (state, callback) => {return;};
	}
	render() {
        if (this.state.areYouSure) {
			return (
				<div>
					<p>This will restart the entire performance. Are you sure?</p>
					<Button text="Start over" id="end" onClicked={this.handleRestartButton} />
					<Button text="Go back" id="back" onClicked={this.handleBackButton} />
				</div>
			);
		} else if (this.state.passwordCorrect && this.props.performance) {
			let currentLine, currentChoices, continueButton;
			if (this.props.performance.currentLine !== "") {
				if (this.props.performance.currentSpeaker) { 
					currentLine = (
						<div className={this.props.performance.currentSpeaker}>
							<p>{this.props.performance.currentSpeaker.toUpperCase()}:</p>
							<p>{this.props.performance.currentLine}</p>
						</div>
					);
				}
				continueButton = (
					// This shows when button will only advance dialogue, with no change to the script
					<Button text="Next line" id="continue" styleClass="highlight" onClicked={this.handleContinueButton} />
				);
			}
			if (this.props.performance.choices) {
				const choices = this.props.performance.choices;
				const choiceKeys = Object.keys(choices);
				const choiceList = choiceKeys.map((i) =>
					<li key={i} className={choices[i].speaker}>
						<span>{choices[i].text+" ("+choices[i].votes+" votes)"}</span>
						{choiceKeys.length > 1 ? <Button text="Force Choice"  id={`pick-${i}`} onClicked={() => this.handlePickSpecificButton(i)} /> : null } 
					</li>
				);
				currentChoices = (
					<ol className="choice-list">{choiceList}</ol>
				);

				if (!continueButton) {
					continueButton = (
						// This shows when the button will end voting and select a branch of the script
						<Button text="Next section" id="pick" styleClass="highlight" onClicked={this.handlePickButton} />
					);
				}
			}
			let r = null;
			if (this.props.performance.rants) {
				r = Object.keys(this.props.performance.rants).map((i) =>
					<li key={i}>{this.props.performance.rants[i]}</li>
				);
			}
			return (
				<div id="mod">
					<h2>Performance controls</h2>
					{continueButton}

                    <h2>Current line</h2>
					{currentLine}
                    <h2>Current choices</h2>
					{currentChoices}
                   
                    <h2>Current rant content</h2>
                    <ul>{r}</ul>
                    <Button text="Reset rant" onClicked={this.handleRantButton} />

					<h2>Danger Zone</h2>
					<Button text="Start over" id="end" onClicked={this.handleRestartButton} />
				</div>
			);
		} else {
			let passwordText = <p>Password:</p>;
			if (this.state.attemptedPassword) {
				passwordText = <p>Wrong password. Try again:</p>;
			}
			return (
				<div>
					{passwordText}
					<TextBox onSubmitted={this.handlePassword} />
				</div>
			);
		}
	}
}

export default Moderator;
