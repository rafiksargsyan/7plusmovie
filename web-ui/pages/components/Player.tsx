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

		var manifestUri = 'https://d3ezbh7ttypwmz.cloudfront.net/560ffd76-9dc5-495d-b030-7e855c3de517/dash/manifest.mpd';

		const video = this.videoComponent.current;

		var player = new shaka.Player(video);

		// Listen for error events.
  		player.addEventListener('error', this.onErrorEvent);

        player.getNetworkingEngine()?.registerRequestFilter(function(type, request) {
          if (type === shaka.net.NetworkingEngine.RequestType.MANIFEST ||
			type === shaka.net.NetworkingEngine.RequestType.SEGMENT) {
				request.uris[0] += "?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9kM2V6Ymg3dHR5cHdtei5jbG91ZGZyb250Lm5ldC81NjBmZmQ3Ni05ZGM1LTQ5NWQtYjAzMC03ZTg1NWMzZGU1MTcvKiIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6IjE2ODA1NjYxMDczMTEifX19XX0_&Key-Pair-Id=K3HCOMKE3RPI6V&Signature=dLfGZVU0gteofo3IQ6CYTiSnLqufablQIYRHcMJ11zQERSfMekATyw89lOZPJ3oWg-pbB6f0FNdYBe7x-5EuNyGlQv1A1LxC7SrHxbko4ddePknHqf4JxkivwcCpvx90rAlRHwt1bno~eak3~wf5IgYoVi126Xm32UTHeOXhZpzh9arfIMoc7ZziRec6Ig3yzvHajWPPPyZ05-KyphdFMQDCc4ZYD~06Brso485U1fmbhRiECscYYtegt5LwTq6U~AWCNfj8oZGmDwjKShGcPKa4qCHl~XMpguCZxdCRKoLpg7LP5eQq6sq3LRM6oumMn8818txr0WaPbFn4y6xRsQ__"
			}
		});

  		// Try to load a manifest.
	  	// This is an asynchronous process.
	  	player.load(manifestUri).then(function() {
		    // This runs if the asynchronous load is successful.
		    console.log('The video has now been loaded!');
			console.log(player.getAudioLanguages());
	  	}).catch(this.onError);  // onError is executed if the asynchronous load fails.

               
	}

	render(){	
		return (
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