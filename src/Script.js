import firebase from './firebase.js';
import axios from 'axios';

const Story = require('inkjs').Story;

class Script {
	initPerformance(props, id) {
		axios.get("./script.json").then((res) => this.setScript(res.data, id, props));
	}
	setScript(json, id, props) {
		this.story = new Story(json);
		if (!props) {
			this.continue(id);
		} else {
			this.story.state.LoadJson(props.saveState);
		}
	}
	continue(id, props = null) {
		let nextLines = [];
		let audience = null;
		let choices = null;
		let rants = null;
		if (props) {
			if (props.nextLines) nextLines = props.nextLines;
			if (props.audience) audience = props.audience;
			if (props.choices) choices = props.choices;
			if (props.rants) rants = props.rants;
		} else {
			nextLines = [];
			while (this.story.canContinue) {
				nextLines.push(this.story.Continue());
			}
			let numChoices = this.story.currentChoices.length;
			if (numChoices > 0) {
				choices = {};
				for (let i = 0; i < numChoices; i++) {
					choices[i] = { text: null, speaker: null, votes: 0 };
					let newText = this.story.currentChoices[i].text.replace('/', '');
					choices[i].text = this.getLineText(newText);
					choices[i].speaker = this.getSpeaker(newText);
				}
			}
		}
		let line = "";
		while (nextLines.length > 0) {
			line = nextLines.shift();
			const speaker = this.getSpeaker(line)
            if (line.includes('@') || speaker === 'AUDIENCE') {
				audience = this.getLineText(line);
			} else {
				break;
			}
		}
		
		const state = this.story.state.toJson();
		firebase.database().ref(id).set({
			currentLine: this.getLineText(line),
			currentSpeaker: this.getSpeaker(line),
			nextLines: nextLines,
			audience: audience,
			choices: choices,
			rants: rants,
			saveState: state,
		});
	}
	getLineText(text) {
		let newText = text.replace(/\w+: /, '');
		return newText.trim();
	}
	getSpeaker(text) {
		if (text.includes(": ")) {
			return text.slice(0, text.indexOf(": "));
		}
		return null;
	}
	pickChoice(choice, id) {
		this.story.ChooseChoiceIndex(choice);
		this.continue(id);
	}
	startOver(id) {
		this.story.ChoosePathString("Start");
		this.continue(id);
	}
}

const instance = new Script();
export default instance;
