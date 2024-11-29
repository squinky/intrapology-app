import React from 'react';

class Subtitles extends React.Component {
	render() {
		let currentLine;
		if (this.props.performance && this.props.performance.currentLine !== "") {
			if (this.props.performance.currentSpeaker) {
                if (this.props.performance.currentLine.includes("Firebase-read")) {
                    currentLine = (
                        <p>{this.props.performance.currentSpeaker.toUpperCase()}: (Reads the audience-generated rant, displayed on the right)</p>
                    );
		        } else {
				    currentLine = (
					    <p>{this.props.performance.currentSpeaker.toUpperCase()}: {this.props.performance.currentLine}</p>
				    );
                }
			}
		}
		return (
			<div className = "App-subtitles">
				<div className = "App-subtitles-container">
					{currentLine}
				</div>
			</div>
		);
	}
}

export default Subtitles;
