import 'react-native';
import React from 'react';
import Microphone from './Microphone';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

describe('Microphone', () => {
  it('renders correctly', () => {
    renderer.create(
      <Microphone />
    );
  });
});

