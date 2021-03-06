import React, {Component} from 'react';
import {Text, View, SafeAreaView, TouchableOpacity, ScrollView} from 'react-native';
import CustomHeader from '../../components/CustomHeader/CustomHeader';
import {TextInputMask} from 'react-native-masked-text';
import Modal from 'react-native-modal';
import {connect} from 'react-redux';

import styles from './styles';
import stylesModalAvaliacao from './styleModalAvaliacao';
import Toast from 'react-native-simple-toast';
import ModalDefault from '../../components/ModalDefault/ModalDefault';
import api from '../../config/api';
import ModalTriplo from '../../components/ModalTriplo/ModalTriplo';
import Spinner from 'react-native-loading-spinner-overlay';
import ButtonCustom from '../../components/ButtonCustom/ButtonCustom';
import ModalSenha from '../../components/ModalSenha/ModalSenha';
import StarRating from 'react-native-star-rating';
import Balance from '../../components/Balance';

class Withdraw extends Component {
  constructor(props) {
    super(props);

    this.state = {
      shouldGoBack: false,
      isModalVisible: false,
      value: '',
      inputColor: 'gray',
      msgErro: [],
      showModal: false,
      depositoSugerido: null,
      taxa: null,
      spinner: false,
      mask: ['[000].[000]'],
      codigoTransacao: null,
      exibirModal: false,
      ShowModalSenha: false,
      senhaModal: this.props.senhaModal,
      codValido: false,
      modalAvaliacao: false,
      starCount: 0,
      IdEmpresaRequisicao: null,
      DataRequisicao: null,
      HoraRequisicao: null,
      CodigoRequisicao: null,
      ValorRequisicao: null,
      AvaliacaoEmpresa: null,
      operacao: null,
      isModalVisibleResume: false,
      carregamentoTela: true,
    };

    this.setState({senhaModal: ''});
  }

  componentDidMount() {
    const {navigation} = this.props;

    this.focusListener = navigation.addListener('didFocus', async () => {
      this.setState({carregamentoTela: true, spinner: true});

      this.setState({
        shouldGoBack: false,
        isModalVisible: false,
        value: '',
        inputColor: 'gray',
        msgErro: [],
        showModal: false,
        depositoSugerido: null,
        taxa: null,
        mask: ['[000].[000]'],
        codigoTransacao: null,
        exibirModal: false,
        ShowModalSenha: false,
        senhaModal: this.props.senhaModal,
        codValido: false,
        modalAvaliacao: false,
        starCount: 0,
        IdEmpresaRequisicao: null,
        DataRequisicao: null,
        HoraRequisicao: null,
        CodigoRequisicao: null,
        ValorRequisicao: null,
        AvaliacaoEmpresa: null,
        operacao: null,
        isModalVisibleResume: false,
      });
      this.setState({carregamentoTela: false, spinner: false});
    });
  }

  modal() {
    this.setState({exibirModal: true});
  }

  openModal = () => this.setState({exibirModal: true});

  closeModal = () => this.setState({exibirModal: false});

  toggleModal = () => {
    this.setState({isModalVisible: !this.state.isModalVisible});
  };

  toggleModalTriplo = () => {
    this.setState({showModal: !this.state.showModal});
  };

  removeMascara(valor) {
    return valor.replace(/[^0-9]/g, '');
  }

  buscaInfoDeposito() {}

  openModalSenha = async () => {
    if (this.state.value.length === 0) {
      this.exibiErro('Favor informar o c??digo da transa????o.');
    } else if (this.state.value.length < 7) {
      //Testa se c??digo de transa????o tem tamanho correto considerando ponto
      this.exibiErro('C??digo incompleto');
    } else {
      this.setState({ShowModalSenha: true});
    }
  };

  async onStarRatingPress(rating) {
    await this.setState({
      starCount: rating,
    });
  }

  async validarCodigo() {
    const codigo = this.removeMascara(this.state.value);

    this.setState({spinner: true});
    await api
      .get(
        `/requisition/identification?company_id=${
          this.props.client.company.id
        }&requisition_code=${codigo}&requisition_type=2`,
      )
      .then(async response => {
        this.setState({spinner: false});
        //Grava chave para a proxima autentica????o na API

        await this.setState({
          codigoTransacao: response.data,
          codValido: true,
          IdEmpresaRequisicao: response.data.id,
          DataRequisicao: response.data.created_at,
          HoraRequisicao: response.data.created_time,
          CodigoRequisicao: response.data.requisition_code,
          ValorRequisicao: response.data.value,
          AvaliacaoEmpresa: response.data.score.user_score,
          operacao: 'saque',
        });
      })
      .catch(async error => {
        //Grava chave para a proxima autentica????o na API

        this.setState({spinner: false});

        if (error.response.data.errors[0].detail == 'Invalid code') {
          this.setState({msgErro: ['O c??digo n??o ?? valido.']});
        } else if (
          error.response.data.errors[0].detail == 'Requisition already canceled'
        ) {
          this.setState({msgErro: ['Requisi????o j?? finalizada ou cancelada.']});
        } else if (
          error.response.data.errors[0].detail == 'Requisition already finished'
        ) {
          this.setState({msgErro: ['Requisi????o j?? finalizada.']});
        } else {
          this.setState({
            msgErro: ['Erro inesperado, se persistir contate o suporte.'],
          });
        }

        // DEVE HABILITAR DEPOIS DOS TESTE DE DESV
        this.openModal();
      });
  }

  solicitarSenha = () => {
    this.setState({ShowModalSenha: true});
  };

  liberarDeposito = async () => {
    this.setState({ShowModalSenha: false});
    let params = {
      requisition: {
        password: this.props.senhaModal[0],
      },
    };

    this.setState({spinner: true});
    await api
      .post(
        `/deposit/receipt?requisition_id=${this.state.codigoTransacao.id}`,
        params,
      )
      .then(async response => {
        this.setState({spinner: false});
        //Grava chave para a proxima autentica????o na API

        this.setState({modalAvaliacao: true});
      })
      .catch(async error => {
        this.setState({spinner: false});
        //Grava chave para a proxima autentica????o na API

        if (error.response.data.errors[0].detail == 'Invalid code') {
          this.setState({msgErro: ['O c??digo n??o ?? valido.']});
        }

        if (error.response.data.errors[0].detail === 'Wrong password') {
          this.setState({msgErro: ['Senha inv??lida.']});
        }
        this.openModal();
      });
  };

  enviaAvaliacao = async () => {
    await api
      .post(
        `create/user/score?requisition_id=${this.state.codigoTransacao.id}`,
        {
          score: {
            score: this.state.starCount,
          },
        },
      )
      .then(async response => {
        //Atualiza tokens para proxima requisi????o

        this.props.navigation.navigate('DepositoConcluidoEmpresa', {
          novoSaldo: response.data.balance,
        });
      })
      .catch(async error => {
        //Atualiza tokens para proxima requisi????o
      });
  };

  async exibiErro(msg) {
    Toast.show(msg, Toast.SHORT);
  }

  sacarValor = () => {
    this.setState({codigoTransacao: null});
  };

  fecharModal = () => {
    this.setState({ShowModalSenha: false});
  };

  render() {
    if (this.state.senhaModal === 6) {
      this.buscaInfoDeposito();
    }

    return (
      <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
        <ModalSenha
          useNativeDriver={true}
          animationType="fade"
          isVisible={this.state.ShowModalSenha}
          fechar={() => this.fecharModal()}
          validar={this.liberarDeposito}
        />
        <Spinner visible={this.state.spinner} color="white" />
        {!this.state.carregamentoTela && (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{flex: 1}}>
            <ModalTriplo
              ConteudoTextoModal={
                'Voc?? est?? tentando sacar todo dinheiro dispon??vel, mas precisa deixar R$ ' +
                this.state.taxa +
                ' do custo do deposito.\n\n Deseja sacar R$ ' +
                this.state.depositoSugerido +
                '?'
              }
              TextoBot??oFechar={''}
              TextoBot??oFun????o={'CONTINUAR'}
              TamanhoDoTexto={18}
              CorBot??oFechar={'#707070'}
              CorBot??oFun????o={'#007F0B'}
              isModalVisible={this.state.showModal}
              Fechar={''}
              Fun????o={() => this.toggleModalTriplo()}
            />
            <ModalDefault
              openModal={this.state.exibirModal}
              closeModal={this.closeModal}
              MsgErro={this.state.msgErro}
              tipoModal={'erro'}
            />
            <CustomHeader
              title="Setting"
              isHome={true}
              navigation={this.props.navigation}
            />
            <View style={styles.container}>
              <View style={styles.header}>
                <Balance />
              </View>
              {!this.state.codigoTransacao ? (
                <View style={styles.content}>
                  <Text style={styles.question}>C??digo para dep??sito:</Text>
                  <Text style={styles.inquiry}>Digite o c??digo</Text>
                  <View style={{alignItems: 'center'}}>
                    <TextInputMask
                      style={
                        this.state.value.length != 7
                          ? [styles.inputValue, {color: 'gray'}]
                          : [styles.inputValue, {color: '#007f0b'}]
                      }
                      type={'custom'}
                      options={{
                        mask: '999.999',
                      }}
                      onChangeText={async text => {
                        await this.setState({value: text}),
                          this.state.value.length == 7
                            ? this.validarCodigo()
                            : null;
                      }}
                      onPress={
                        this.state.value.length == 7
                          ? () => this.validarCodigo()
                          : null
                      }
                      placeholder={'000.000'}
                      value={this.state.value}
                      keyboardType="numeric"
                    />
                  </View>
                  <Text>{this.state.rawValue}</Text>
                </View>
              ) : (
                <View style={styles.content}>
                  <Text style={styles.questionInfo}>Valor informado:</Text>
                  <View style={{alignItems: 'center'}}>
                    <Text style={[styles.displayValue, {color: 'green'}]}>
                      {this.state.codigoTransacao?.value}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        this.setState({isModalVisibleResume: true});
                      }}>
                      <Text style={styles.abstract}>VER RESUMO</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {this.state.codigoTransacao && (
                <Modal isVisible={this.state.isModalVisibleResume}>
                  <View style={styles.modal}>
                    <View style={{alignItems: 'center'}}>
                      <Text style={styles.descriptionWithdrawTitle}>
                        Resumo do dep??sito
                      </Text>
                    </View>

                    <View
                      style={{
                        alignitems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 20,
                      }}>
                      <Text
                        style={{
                          color: 'black',
                          textAlign: 'center',
                          fontFamily: 'Montserrat-Bold',
                        }}>
                        Em andamento
                      </Text>
                      <Text style={styles.descriptionWithdraw}>
                        Data: {this.state.DataRequisicao}
                      </Text>
                      <Text style={styles.descriptionWithdraw}>
                        Hora: {this.state.HoraRequisicao}
                      </Text>
                      <Text style={styles.descriptionWithdraw}>
                        C??digo: {this.state.CodigoRequisicao}
                      </Text>
                      <Text style={styles.descriptionWithdraw}>
                        Valor: {this.state.ValorRequisicao}
                      </Text>
                      <Text style={styles.descriptionWithdraw}>
                        Avalia????o: {this.state.AvaliacaoEmpresa}{' '}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{paddingTop: 10}}
                      onPress={() =>
                        this.setState({isModalVisibleResume: false})
                      }>
                      <Text style={styles.textButtonClose}>FECHAR</Text>
                    </TouchableOpacity>
                  </View>
                </Modal>
              )}
              <View style={styles.footer}>
                {!this.state.codigoTransacao ? (
                  <ButtonCustom
                    rippleCentered={true}
                    navegar={
                      this.state.codValido == true
                        ? !this.state.codigoTransacao
                          ? this.openModalSenha
                          : this.sacarValor
                        : () =>
                            this.exibiErro(
                              'Favor informar o c??digo da transa????o.',
                            )
                    }
                    textButton={'CONTINUAR'}
                    btnColor={
                      this.state.value.length === 7 ? '#007f0b' : 'grey'
                    }
                    textColor={'white'}
                    borderColor={
                      this.state.value.length === 7 ? '#007f0b' : 'grey'
                    }
                  />
                ) : (
                  <ButtonCustom
                    rippleCentered={true}
                    navegar={this.solicitarSenha}
                    textButton={'CONCLUIR DEP??SITO'}
                    btnColor={'#007f0b'}
                    textColor={'white'}
                    borderColor={'#007f0b'}
                  />
                )}
              </View>
              <Modal isVisible={this.state.isModalVisible}>
                <View>
                  <View style={styles.contentModal}>
                    <View style={{flex: 0.4}}>
                      <Text style={styles.textContentModal0}>
                        Para continuar, ative o GPS (localiza????o) do seu
                        celular.
                      </Text>
                    </View>
                    <View style={{flexDirection: 'row', top: 20, flex: 0.3}}>
                      <View style={{marginRight: 60, alignItems: 'center'}}>
                        <TouchableOpacity onPress={this.toggleModal}>
                          <Text style={styles.textContentModal1}>CANCELAR</Text>
                        </TouchableOpacity>
                      </View>
                      <View>
                        <TouchableOpacity onPress={this.funcModal}>
                          <Text style={styles.textContentModal2}>ATIVAR</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </Modal>

              <Modal isVisible={this.state.modalAvaliacao}>
                <View style={stylesModalAvaliacao.containerModal}>
                  <View style={{alignItems: 'center'}}>
                    <View style={{flexDirection: 'row'}}>
                      <View
                        style={{width: '144%', alignItems: 'center', left: 14}}>
                        <Text style={stylesModalAvaliacao.textConclusion}>
                          Solicita????o conclu??da
                        </Text>
                      </View>
                      <View style={stylesModalAvaliacao.containerXButton}>
                        <TouchableOpacity
                          onPress={() =>
                            this.props.navigation.navigate(
                              'DepositoConcluidoEmpresa',
                              {
                                valorDeposito: this.state.ValorRequisicao,
                              },
                            )
                          }>
                          <Text style={stylesModalAvaliacao.xButtonText}>
                            ???
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={{width: '150%'}}>
                      <Text style={stylesModalAvaliacao.storeNameText}>
                        avaliar solicitante?
                      </Text>
                    </View>
                  </View>
                  <StarRating
                    disabled={false}
                    emptyStar={'star'}
                    fullStar={'star'}
                    halfStar={'star'}
                    iconSet={'FontAwesome'}
                    maxStars={5}
                    rating={this.state.starCount}
                    selectedStar={rating => this.onStarRatingPress(rating)}
                    fullStarColor={'#FEC107'}
                    starSize={35}
                    emptyStarColor={'#E9E9E9'}
                  />
                  <View style={{alignItems: 'center'}}>
                    <TouchableOpacity onPress={() => this.enviaAvaliacao()}>
                      <Text style={stylesModalAvaliacao.rateText}>AVALIAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }
}

const mapStateToProps = ({empresa, senhaModal, client}) => {
  return {
    senhaModal: senhaModal.senhaModal,
    client,
  };
};

// export default Withdraw
export default connect(
  mapStateToProps,
  null,
)(Withdraw);
