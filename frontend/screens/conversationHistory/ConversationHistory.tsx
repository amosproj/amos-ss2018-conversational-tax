import React, { Component } from 'react';
import RestConnection from '../../services/RestConnection';
import List from './components/List';
import { ConversationHistoryInterface } from './interfaces/ConversationHistory.interface';
import Wrapper from '../../shared/Wrapper';
import RoundContentWrapper from '../../shared/RoundContentWrapper';

interface IProps {
}

interface IState {
  data: ConversationHistoryInterface[],
}

/**
 * This class implements the ConversationHistory and its functionality
 * @class ConversationHistory
 */
export default class ConversationHistory extends Component<IProps, IState> {

  private readonly restClient: RestConnection = new RestConnection();

  /**
   * Initializes an instance of ConversationHistory
   */
  constructor(props: IProps) {
    super(props);

    this.state = {
      data: [],
    };
  }

  /**
   * Handler that is called short before the component is mounted
   */
  async componentWillMount() {

    let history: ConversationHistoryInterface[] = await this.getConversationHistory();

    this.setState({
      data: history,
    });

  }

  /**
   * Rendering function for the ConversationHistory
   */
  public render() {

    return (
      <Wrapper>
        <RoundContentWrapper title="Verlauf">
          <List data={this.state.data} />
        </RoundContentWrapper>
      </Wrapper>
    );
  }

  /**
   * Get the current conversation history of the user
   * @returns {Promise<Array<ConversationHistoryInterface>>} - A promise containing the conversation history json as string
   */
  private async getConversationHistory(): Promise<Array<ConversationHistoryInterface>> {

      return await this.restClient.getConversationHistory();

  }

}
