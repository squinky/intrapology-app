import firebase from './firebase.js';
import axios from 'axios';

const Story = require('inkjs').Story;

class Script {
	initPerformance(props, id) {
		axios.get("./script.json").then((res) => this.setScript(res.data, id, props));
	}
	setScript(json, id, props) {
		this.story = new Story(json);
		this.seenChoices = new Set()

		// Originally intended to listen to functions being called, but internal ink functions
		// don't seem to cause this to fire.
		this.story.variablesState.ObserveVariableChange((name,val)=>{
			if(!this.rants){
				return;
			}
	
			const MAGIC_VALUE = 'Get-Random-Rant'
			if(val.value !== MAGIC_VALUE){
				return
			}

			const allRants = Object.values(this.rants);
			if(!allRants.length){
				return;
			}

			let finalChoice = null;
			let numTries = 0;
			const MAX_TRIES = 10
			while(numTries < MAX_TRIES){
				numTries +=1;
				const choice = allRants[Math.floor(Math.random() * allRants.length)];
				// Prevent an infinite loop, if someone submitted Get-Random-Rant for whatever reason
				if(choice === MAGIC_VALUE){
					continue
				}
				// This tries to ensure that each random draw is unique
				if(this.seenChoices.has(choice)){
					continue
				}
				finalChoice = choice;
				break
			}

			if(finalChoice){
				this.seenChoices.add(finalChoice)
				this.story.variablesState.$(name, finalChoice)
			} else {
				this.story.variablesState.$(name, '')
			}
		})

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
            if (line.includes('@')) {
				audience = this.getLineText(line);
			} else {
				break;
			}
		}

		this.rants = rants;

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
