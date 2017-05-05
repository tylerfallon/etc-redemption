import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { Form, Divider, Button, Label } from 'semantic-ui-react';

import RedemptionButton from './redemption_button.jsx';

const { getDefaultAddress } = require('@digix/spectrum/src/selectors');
const { isAddress } = require('@digix/spectrum/src/helpers/stringUtils');

class RedemptionInfo extends Component {
  constructor(props) {
    super(props);
    this.state = { address: '' };
    this.handleRedeem = this.handleRedeem.bind(this);
    this.handleMined = this.handleMined.bind(this);
  }
  componentDidMount() {
    this.getBalances();
  }
  componentWillReceiveProps({ defaultAddress }) {
    const { address: nextAddress } = defaultAddress || {};
    const { address } = this.props.defaultAddress || {};
    if (nextAddress && address !== nextAddress) {
      this.getBalances(nextAddress);
    }
  }
  getBalances(nextAddress) {
    const { contract, defaultAddress } = this.props;
    const { address } = defaultAddress || {};
    const a = nextAddress || address;
    console.log('getting balances', a);
    if (a) {
      contract.balanceOf.call(a);
      contract.redeemedOf.call(a);
    }
  }
  handleRedeem(data) {
    const { recipient, ...params } = data;
    const { contract } = this.props;
    if (!isAddress(recipient)) { throw new Error('You must enter recipient address'); }
    return contract.redeem.sendTransaction(recipient, { ...params, ui: { type: 'digixEtcRedemption' } });
  }
  handleMined(txInfo) {
    const { formData } = txInfo;
    this.getBalances(formData.recipient);
    this.getBalances(formData.from);
  }
  render() {
    const { web3, defaultAddress, data, contract, network } = this.props;
    if (!defaultAddress) { return null; }
    const balanceOf = contract.balanceOf(defaultAddress.address);
    const redeemedOf = contract.redeemedOf(defaultAddress.address);
    const dgdrBalance = balanceOf && balanceOf.toNumber() && balanceOf.div(1e9).toFormat(2);
    const etcBalance = balanceOf && balanceOf.toNumber() && balanceOf.mul(data.rate).div(1e18).toFormat(2);
    const dgdrRedeemed = redeemedOf && redeemedOf.toNumber() && redeemedOf.div(1e9).toFormat(2);
    return (
      <Form>
        <Form.Field style={{ textAlign: 'center' }}>
          {etcBalance ?
            <RedemptionButton {...{ web3, network, dgdrBalance, defaultAddress, etcBalance }} />
          :
            <Button
              fluid
              disabled
              basic
              content="Selected account has no DGDR balance"
              size="huge"
              icon="frown"
            />
          }
          <Divider hidden />
          {!!dgdrRedeemed &&
            <Label content={`You have already redeeemd ${dgdrRedeemed} DGDR`} size="large" color="blue" icon="history" />
          }
        </Form.Field>
      </Form>
    );
  }
}

RedemptionInfo.propTypes = {
  defaultAddress: PropTypes.object,
  contract: PropTypes.object.isRequired,
  web3: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
  network: PropTypes.object.isRequired,
};

export default connect(state => ({ defaultAddress: getDefaultAddress(state) }))(RedemptionInfo);
