/** @jsx React.DOM */

var React = require('react');
var ReactDom = require('react-dom')
var GlobeFactory = require('../lib/GlobeFactory');
var geodecoder = require('../lib/geodecoder');

module.exports = React.createClass({
  componentDidMount: function() {
    var countries = topojson.feature(this.props.worldData, this.props.worldData.objects.countries)
    var element = ReactDom.findDOMNode(this.refs.globe);

    globe = GlobeFactory.createGlobe(element, countries)
    globe.animate();

    this.setState({globe: globe});
  },
  componentDidUpdate: function() {
    // this is not correct

    if (!this.props.userCountryData) {
      return;
    }

    var globe = this.state.globe;

    globe.paintCountyTextures(this.props.userCountryData, this.state.geodecoder);

    // countriesTopList(data);
  },
  render: function () {
    return (
      <div ref="globe" id="globe"></div>
    )
  }
});
