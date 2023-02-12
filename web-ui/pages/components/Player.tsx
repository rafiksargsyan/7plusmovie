import React from 'react';
import shaka from 'shaka-player';

class VideoPlayer extends React.PureComponent {
	videoComponent: React.RefObject<HTMLVideoElement>;

	constructor(props: {} | Readonly<{}>){

		super(props);

		this.videoComponent = React.createRef();

		this.onErrorEvent = this.onErrorEvent.bind(this);

		this.onError = this.onError.bind(this);
	}

	onErrorEvent(event: { detail: any; }) {
	  // Extract the shaka.util.Error object from the event.
	  this.onError(event.detail);
	}

	onError(error: { code: any; }) {
	  // Log the error.
	  console.error('Error code', error.code, 'object', error);
	}

	componentDidMount(){

		var manifestUri = 'https://d1n96mesd94mzl.cloudfront.net/output-720-1080/manifest.mpd';

		const video = this.videoComponent.current;

		var player = new shaka.Player(video);

		// Listen for error events.
  		player.addEventListener('error', this.onErrorEvent);

  		// Try to load a manifest.
	  	// This is an asynchronous process.
	  	player.load(manifestUri).then(function() {
		    // This runs if the asynchronous load is successful.
		    console.log('The video has now been loaded!');
			console.log(player.getAudioLanguages());
	  	}).catch(this.onError);  // onError is executed if the asynchronous load fails.

               
	}

	render(){

		return(
				<video
					style={{width: '100vw', height: '100vh', objectFit: 'cover', maxWidth: '100%', maxHeight: '100%'}}
					ref={this.videoComponent}
					poster="//shaka-player-demo.appspot.com/assets/poster.jpg"
					controls
				/>
		);
	}
}

export default VideoPlayer;