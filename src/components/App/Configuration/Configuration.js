import React from "react";
import "./Configuration.css";
import axios from "axios";
import { Redirect } from "react-router-dom";
import _ from "lodash";

class Configuration extends React.Component {
  constructor(props) {
    super(props);
    // Set component mounted
    this._isMounted = false;
    // Define initial state
    this.state = {
      authenticated: true,
      serverError: "",
      configuration: {
        primaryAngle: null,
        secondaryAngle: null,
        timeToFocus: null,
        minAngleBetweenSounds: null,
        maxMediaPlayers: null,
        maxIdleSensorDifference: null,
        maxIdleSeconds: null
      },
      formControls: {
        primaryAngle: null,
        secondaryAngle: null,
        timeToFocus: null,
        minAngleBetweenSounds: null,
        maxMediaPlayers: null,
        maxIdleSensorDifference: null,
        maxIdleSeconds: null
      },
      loading: false
    };
    // Bind functions to class
    this.changeHandler = this.changeHandler.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.canSubmit = this.canSubmit.bind(this);
    this.regenerateSoundDirections = this.regenerateSoundDirections.bind(this);
  }

  async componentDidMount() {
    // Set component mounted
    this._isMounted = true;
    // Try to get configuration from the server
    const configuration = await this.getConfiguration();
    // Update starting form values and the configuration state
    if (configuration) {
      // Stringify configuration values
      let configurationStringified = { ...configuration };
      for (const key in configurationStringified) {
        if (configurationStringified.hasOwnProperty(key)) {
          configurationStringified[key] = configurationStringified[
            key
          ].toString();
        }
      }
      // Update state
      let newState = { ...this.state };
      newState.configuration = { ...configurationStringified };
      newState.formControls = { ...configurationStringified };
      this.setState(newState);
    }
  }

  async componentWillUnmount() {
    // Set component mounted
    this._isMounted = false;
  }

  async getConfiguration() {
    // Set as loading
    let newState = { ...this.state };
    newState.loading = true;
    this._isMounted && this.setState(newState);
    try {
      // Make GET request to the server
      const response = await axios.get(
        process.env.REACT_APP_API_URL + "/configuration"
      );
      // Set not loading
      let newState = { ...this.state };
      newState.loading = false;
      this._isMounted && this.setState(newState);
      // Return configuration
      return response.data.configuration;
    } catch (e) {
      // Update error message in state and not loading
      let newState = { ...this.state };
      newState.serverError = "Could not retrieve configuration from the server";
      newState.loading = false;
      this._isMounted && this.setState(newState);
    }
  }

  async postConfiguration(configuration) {
    // Set as loading
    let newState = { ...this.state };
    newState.loading = true;
    this._isMounted && this.setState(newState);
    try {
      // Send POST request to server
      const response = await axios.post(
        process.env.REACT_APP_API_URL + "/configuration",
        configuration,
        {
          withCredentials: true
        }
      );
      if (response.status === 200) {
        // Remove error message, update configuration state and set not loading
        let newState = { ...this.state };
        newState.loading = false;
        newState.serverError = "";
        newState.configuration = { ...configuration };
        this._isMounted && this.setState(newState);
      }
    } catch (e) {
      // Log out if unauthorised
      if (e.response.status === 401) {
        this.logOut();
      } else {
        // Update error message in state and set not loading
        let newState = { ...this.state };
        newState.loading = false;
        newState.serverError = "Could not send configuration to the server";
        this._isMounted && this.setState(newState);
      }
    }
  }

  async regenerateSoundDirections() {
    // Set as loading
    let newState = { ...this.state };
    newState.loading = true;
    this._isMounted && this.setState(newState);
    try {
      // Send POST request to server endpoint
      const response = await axios.post(
        process.env.REACT_APP_API_URL + "/sounds/regenerateDirections",
        {},
        {
          withCredentials: true
        }
      );
      if (response.status === 200) {
        // Remove error message, enable button and update state
        let newState = { ...this.state };
        newState.loading = false;
        newState.serverError = "";
        this._isMounted && this.setState(newState);
      }
    } catch (e) {
      // Log out if unauthorised
      if (e.response.status === 401) {
        this.logOut();
      } else {
        // Update error message in state
        let newState = { ...this.state };
        newState.loading = false;
        newState.serverError = "Could not regenerate sound directions";
        this._isMounted && this.setState(newState);
      }
    }
  }

  changeHandler(event) {
    // Retrieve form values from event
    const name = event.target.name;
    const value = event.target.value;
    // Update configuration state with values
    let newState = { ...this.state };
    newState.formControls[name] = value;
    this.setState(newState);
  }

  async submitForm(event) {
    // Prevent default form submission action
    event.preventDefault();
    // Check whether minimum angle between sounds has been changed
    const minAngleBetweenSoundsChanged =
      this.state.configuration.minAngleBetweenSounds !==
      this.state.formControls.minAngleBetweenSounds;
    // POST configuration from form to the server
    await this.postConfiguration(this.state.formControls);
    // If the minimum angle between sounds was changed, then regenerate sound directions
    if (minAngleBetweenSoundsChanged) await this.regenerateSoundDirections();
  }

  logOut() {
    // Remove user object from local storage
    localStorage.removeItem("user");
    // Update state
    let newState = { ...this.state };
    newState.authenticated = false;
    this.setState(newState);
  }

  canSubmit() {
    // Check there are no null values
    for (const key in this.state.formControls) {
      if (
        this.state.formControls[key] == null ||
        this.state.formControls[key] === ""
      )
        return false;
    }
    if (_.isEqual(this.state.configuration, this.state.formControls)) {
      return false;
    }
    return true;
  }

  render() {
    // Redirect to if unauthorised
    if (!this.state.authenticated) {
      return <Redirect to="/"></Redirect>;
    }
    // Render Configuration component
    return (
      <div className="Configuration">
        <form onSubmit={this.submitForm}>
          <label>
            Primary Angle
            <input
              className="input"
              type="number"
              name="primaryAngle"
              defaultValue={
                this.state.configuration
                  ? this.state.configuration.primaryAngle
                  : null
              }
              onChange={this.changeHandler}
            />
          </label>
          <label>
            Secondary Angle
            <input
              className="input"
              type="number"
              name="secondaryAngle"
              defaultValue={
                this.state.configuration
                  ? this.state.configuration.secondaryAngle
                  : null
              }
              onChange={this.changeHandler}
            />
          </label>
          <label>
            Time to focus
            <input
              className="input"
              type="number"
              name="timeToFocus"
              defaultValue={
                this.state.configuration
                  ? this.state.configuration.timeToFocus
                  : null
              }
              onChange={this.changeHandler}
            />
          </label>
          <label>
            Minimum angle between sounds
            <input
              className="input"
              type="number"
              name="minAngleBetweenSounds"
              defaultValue={
                this.state.configuration
                  ? this.state.configuration.minAngleBetweenSounds
                  : null
              }
              onChange={this.changeHandler}
            />
          </label>
          <label>
            Maximum media players
            <input
              className="input"
              type="number"
              name="maxMediaPlayers"
              defaultValue={
                this.state.configuration
                  ? this.state.configuration.maxMediaPlayers
                  : null
              }
              onChange={this.changeHandler}
            />
          </label>
          <label>
            Maximum idle sensor difference
            <input
              className="input"
              type="number"
              step="0.001"
              name="maxIdleSensorDifference"
              defaultValue={
                this.state.configuration
                  ? this.state.configuration.maxIdleSensorDifference
                  : null
              }
              onChange={this.changeHandler}
            />
          </label>
          <label>
            Maximum idle seconds
            <input
              className="input"
              type="number"
              name="maxIdleSeconds"
              defaultValue={
                this.state.configuration
                  ? this.state.configuration.maxIdleSeconds
                  : null
              }
              onChange={this.changeHandler}
            />
          </label>
          <div className="buttons">
            <button
              className="input button regenerate-sound-directions"
              onClick={this.regenerateSoundDirections}
              disabled={this.state.loading}
            >
              Regenerate sound directions
            </button>
            <input
              className="input save button"
              type="submit"
              value="Save"
              disabled={!this.canSubmit() || this.state.loading}
            />
          </div>
        </form>
        <div>{this.state.serverError}</div>
      </div>
    );
  }
}

export default Configuration;