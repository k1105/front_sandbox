import React, { Component } from 'react';
import ProfileContent from './content/Profile';
import TracksContent from './content/Tracks';
import SettingContent from './content/Setting';
import Navigation from './nav/Navigation';

export default class App extends Component {
  constructor(props){
    super(props);

    this.state = {
      value: '',
    }
  }
  
  render() {
    const { value } = this.state; //これ{}無いと動かん理由わからん
    const handleChange = (event, value) => { //eventも引数に必要な理由？
      this.setState({ value });
    };
    return(
      <div>
        <Navigation value={ value } handleChange = { handleChange }/>

        {this.state.value === 'Profile' ? 
         <ProfileContent></ProfileContent>
         : 
         this.state.value === 'Tracks' ?
         <TracksContent></TracksContent> 
         :
         this.state.value === 'Setting' ?
         <SettingContent></SettingContent>
         :
         null
        }
        
      </div>
    )
  }
}
