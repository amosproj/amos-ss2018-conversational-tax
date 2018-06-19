import { Controller, Post, Body, UseInterceptors, FileInterceptor, UploadedFile, Query, BadRequestException } from '@nestjs/common';
import { DialogFlowService } from './dialog-flow/dialog-flow.service';
import { AudioIntentParams, TextIntentParams, TextIntentBody } from './lang.dto';
import { UserService } from '../database/user/user.service';
import { EmploymentContractService } from '../database/employmentContract/employmentContract.service';
import { ExplanationService } from './explanation/explanation.service';
import { ListAllContractsService } from './listAllContracts/listAllContracts.service';
import { DatabaseLangService } from '../connectors/database-lang.service';
import { ConversationHistory } from '../database/conversationHistory/interfaces/conversationHistory.interface';

const ANDROID_AUDIO_SETTINGS = {
  encoding: 'AUDIO_ENCODING_AMR_WB',
  sampleRate: 16000,
};

const IOS_AUDIO_SETTINGS = {
  encoding: 'AUDIO_ENCODING_LINEAR_16',
  sampleRate: 16000,
};

const INTENT_HELP = 'projects/test-c7ec0/agent/intents/e695c10c-0a85-4ede-a899-67f264ff5275';
const INTENT_CONTEXT = 'projects/test-c7ec0/agent/intents/39611549-cad9-4152-9130-22ed7879e700';
const INTENT_LISTALLCONTRACTS = 'projects/test-c7ec0/agent/intents/92883a98-404c-4e9f-b385-a5a9108a4764';
const INTENT_DEFAULT = 'projects/test-c7ec0/agent/intents/41d8bfa1-b463-4d15-a1ea-9491f5ee1a76';

@Controller('lang')
export class LangController {

  constructor(
    private dialogFlowService: DialogFlowService,
    private userService: UserService,
    private contractService: EmploymentContractService,
    private explanationService: ExplanationService,
    private listAllContractsService: ListAllContractsService,
    private databaseLangService: DatabaseLangService,
  ) {}

  @Post('text')
  async textIntent(@Body() body: TextIntentBody, @Query() params: TextIntentParams) {
    const dialogflowResponse = await this.dialogFlowService.detectTextIntent(body.textInput, params.u_id);
    return this.handleResponse(dialogflowResponse[0], params);
  }

  @Post('audio_upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file, @Query() params: AudioIntentParams) {
    const dialogflowResponse = await this.processAudiofile(file, params);
    return this.handleResponse(dialogflowResponse[0], params);
  }

  private async handleResponse(
    dialogflowResponse: DetectIntentResponse,
    params: TextIntentParams | AudioIntentParams,
  ): Promise<ReturnText> {

    if (dialogflowResponse.queryResult.queryText === '') {
      return { text: '' };
    }

    const intent = this.dialogFlowService.extractResponseIntent(dialogflowResponse);
    const actionName = this.dialogFlowService.extractResponseAction(dialogflowResponse);

    if (intent !== null && intent !== undefined) {
      const response = await this.handleIntent(params.u_id, intent, dialogflowResponse);
      if (response !== undefined) {
        await this.createConversationHistoryEntry(params.u_id, dialogflowResponse, response.text, intent, actionName);
        return response;
      }
    }

    const text = this.dialogFlowService.extractResponseText(dialogflowResponse);
    await this.createConversationHistoryEntry(params.u_id, dialogflowResponse, text, intent, actionName);
    return { text };
  }

  /**
   * Converts the received audio to Base64 and hands it to the DialogFlow service.
   * @param file The uploaded file.
   * @param params URL params which contain the userID as well as the platform.
   * @returns {Promise<DetectIntentResponse[]>} - A promise containing the response
   */
  private async processAudiofile(file: any, params: AudioIntentParams): Promise<DetectIntentResponse[]> {
    if (file === undefined || file.buffer === undefined) {
      throw new BadRequestException('No audio file was uploaded');
    }
    const base64Audio: string = file.buffer.toString('base64');

    let encoding: string;
    let sampleRate: number;
    if (params.platform === 'android') {
      encoding = ANDROID_AUDIO_SETTINGS.encoding;
      sampleRate = ANDROID_AUDIO_SETTINGS.sampleRate;
    } else if (params.platform === 'ios') {
      encoding = IOS_AUDIO_SETTINGS.encoding;
      sampleRate = IOS_AUDIO_SETTINGS.sampleRate;
    } else {
      throw new BadRequestException('Unkown platform');
    }

    return await this.dialogFlowService.detectAudioIntent(encoding, sampleRate, base64Audio, params.u_id);
  }

  /**
   * Create a new conversation history entry (helper funtion)
   * @param uid The id of the user
   * @param dialogflowResponse The response object of dialogflow
   * @param responseText The response to be logged (may be either the fulfillmentText of dialogflow
   * or a response generated by our code)
   * @param intent The recognized intent
   * @param actionName The recognized action
   */
  private async createConversationHistoryEntry(uid: string,
                                               dialogflowResponse: DetectIntentResponse,
                                               responseText: string,
                                               intent: Intent,
                                               actionName: string) {

    let parameters: any = { fields: {} };
    let queryText: string = 'Not specified';
    let intentName: string = 'Not specified';
    let intentDisplayName: string = 'Not specified';

    if ( dialogflowResponse.hasOwnProperty('queryResult') ) {

      if ( dialogflowResponse.queryResult.hasOwnProperty('parameters') ) {

        parameters = dialogflowResponse.queryResult.parameters;

      }

      if ( dialogflowResponse.queryResult.hasOwnProperty('queryText') ) {

        queryText = dialogflowResponse.queryResult.queryText;

      }

    }

    if ( intent !== null ) {

      if ( intent.hasOwnProperty('name') ) {

        intentName = intent.name;

      }

      if ( intent.hasOwnProperty('displayName') ) {

        intentDisplayName = intent.displayName;

      }

    }

    // Add a new conversation history entry to the data store
    await this.databaseLangService.createConversationHistoryEntry(uid,
                                                                  parameters,
                                                                  queryText,
                                                                  responseText,
                                                                  intentName,
                                                                  intentDisplayName,
                                                                  actionName);

  }

  // TODO move to new architecture as soon as it has been finished.
  // TODO intent name should be moved into a const (as part of the above task)
  private async handleIntent(uid: string, intent: Intent, dialogflowResponse: DetectIntentResponse): Promise<ReturnText | undefined> {
    if (intent.name === 'projects/test-c7ec0/agent/intents/ae4cd4c7-67ea-41e3-b064-79b0a75505c5') {

      if (!await this.userService.exists(uid)) {

        this.userService.create(uid);

      }
      await this.contractService.create(uid);

    } else if (intent.name === 'projects/test-c7ec0/agent/intents/99d07e41-0833-4e50-991e-5f49ba4e9bc4') {

      try {

        if (dialogflowResponse.queryResult.allRequiredParamsPresent) {

          const response: any = dialogflowResponse.queryResult.parameters;

          // EmploymentContract is always a stringValue
          const employmentContractId: string = response.fields.EmploymentContract.stringValue;

          // Start Date is always a structValue
          const startDate: any = response.fields.StartDate.structValue;

          // If a date was recognized as an exact date, startDate has the property 'StartDateAsDate'
          if ( startDate.fields.hasOwnProperty('StartDateAsDate') ) {

            // Although start date is recognized as a date, the value is present in stringValue
            const startDateExact: any = startDate.fields.StartDateAsDate.stringValue;

            await this.contractService.editStartDateExact(employmentContractId, startDateExact);

            // If set was successfull we want to remove a possibly existing startDateString
            await this.contractService.deleteStartDateString(employmentContractId);

          // If a date was not recognized as an exact date, startDate has the property 'StartDateAsDate'
          } else if ( startDate.fields.hasOwnProperty('StartDateAsString') ) {

            // The value of startDate is present in stringValue
            const startDateString: any = startDate.fields.StartDateAsString.stringValue;

            await this.contractService.editStartDateString(employmentContractId, startDateString);

            // If set was successfull we want to remove a possibly existing startDateExact
            await this.contractService.deleteStartDateExact(employmentContractId);

          }
        }

      } catch (error) {

        return { text: 'Beim Ändern des Startdatums ist ein Fehler aufgetreten. Bitte versuche es erneut' };

      }

    } else if (intent.name === 'projects/test-c7ec0/agent/intents/d1523cf3-bb4d-47cb-8fc4-bec3d669628e') {

      try {

        const response: any = dialogflowResponse.queryResult.parameters;
        const employmentContractId = response.fields.EmploymentContract.stringValue;

        // If our parameters are not ready Dialogflow will ask for them
        if (employmentContractId !== '') {

          await this.contractService.editEndDateString(employmentContractId, 'unbefristet');

        }

      } catch (error) {

        return { text: 'Beim Ändern des Enddatums ist ein Fehler aufgetreten. Bitte versuche es erneut' };

      }

    } else if (intent.name === INTENT_HELP) {

      // Return Help
      const history: Array<ConversationHistory> = await this.databaseLangService.getConversationHistoryOfUserWithoutIntents(uid,
                                                                                                                           [INTENT_HELP,
                                                                                                                            INTENT_CONTEXT,
                                                                                                                            INTENT_DEFAULT]);

      if (history.length > 0) {

        const previousResponse = history[0];
        const text = this.explanationService.getHelpText(previousResponse.intent, previousResponse.action);
        return { text };

      }

      return { text: 'Es gibt keine letzte Anfrage zu der ich dir eine Hilfestellung geben könnte' };

    } else if (intent.name === INTENT_CONTEXT) {

      // Return Context
      const history: Array<ConversationHistory> = await this.databaseLangService.getConversationHistoryOfUserWithoutIntents(uid,
                                                                                                                           [INTENT_HELP,
                                                                                                                            INTENT_CONTEXT,
                                                                                                                            INTENT_DEFAULT]);
      if (history.length > 0) {

        const previousResponse = history[0];
        const text = this.explanationService.getContextExplanation(previousResponse.intent);
        return { text };

      }

      return { text: 'Es gibt keine letzte Anfrage zu der ich dir den Kontext nennen könnte' };
    } else if (intent.name === INTENT_LISTALLCONTRACTS) {
      // Get the list of all contracts
      const contracts = this.listAllContractsService.getAllContracts(uid);
      // Get the Answer from Dialogflow
      const answer = 'Das sind deine Arbeitsverträge. ';
      // Combine the answer with the list as strings and return it
      const text = answer + contracts.toString();
      return { text };
	}
    return undefined;

  }

}
