// src/screens/TermsAgreementScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const TermsAgreementScreen = ({ route, navigation }) => {
  const { returnTo, userData } = route.params || { returnTo: "Main" };

  // 약관 동의 상태
  const [serviceTermsAgreed, setServiceTermsAgreed] = useState(false);
  const [privacyTermsAgreed, setPrivacyTermsAgreed] = useState(false);
  const [marketingTermsAgreed, setMarketingTermsAgreed] = useState(false);

  // 모달 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);

  // 모든 필수 약관에 동의했는지 체크
  const allRequired = serviceTermsAgreed && privacyTermsAgreed;

  // 모달 열기 함수
  const openTermsModal = (title, content) => {
    setModalTitle(title);
    setModalContent(content);
    setModalVisible(true);
  };

  // 약관 동의 처리 함수
  const handleAgree = async () => {
    if (!allRequired) {
      Alert.alert(
        "필수 약관 동의",
        "서비스 이용약관과 개인정보 처리방침에 동의해주세요."
      );
      return;
    }

    try {
      // 약관 동의 상태 저장
      await AsyncStorage.setItem("@user_terms_agreed", "true");
      await AsyncStorage.setItem(
        "@user_marketing_agreed",
        marketingTermsAgreed ? "true" : "false"
      );

      // 목적지 화면으로 이동
      navigation.reset({
        index: 0,
        routes: [{ name: returnTo || "Main" }],
      });
    } catch (error) {
      console.error("약관 동의 저장 오류:", error);
      Alert.alert("오류", "약관 동의 정보를 저장하는 중 오류가 발생했습니다.");
    }
  };

  // 모든 약관 한번에 동의
  const handleAgreeAll = (value) => {
    setServiceTermsAgreed(value);
    setPrivacyTermsAgreed(value);
    setMarketingTermsAgreed(value);
  };

  // 서비스 이용약관 내용
  const ServiceTermsContent = () => (
    <ScrollView style={styles.modalContent}>
      <Text style={styles.termSectionTitle}>제1조 (목적)</Text>
      <Text style={styles.termText}>
        본 약관은 플랜이지(이하 "회사")가 제공하는 모바일 애플리케이션
        서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자 간의 권리, 의무
        및 책임 등에 관한 사항을 규정함을 목적으로 합니다.
      </Text>

      <Text style={styles.termSectionTitle}>제2조 (정의)</Text>
      <Text style={styles.termText}>
        1. "서비스"란 회사가 제공하는 일정 관리, 학습 계획, 목표 설정 등의
        기능을 제공하는 플랜이지 애플리케이션을 의미합니다.{"\n"}
        2. "이용자"란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 회원
        및 비회원을 모두 포함합니다.{"\n"}
        3. "회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의
        서비스를 지속적으로 이용할 수 있는 자를 말합니다.
      </Text>

      <Text style={styles.termSectionTitle}>제3조 (약관의 효력 및 변경)</Text>
      <Text style={styles.termText}>
        1. 본 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.{"\n"}
        2. 회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내
        공지사항을 통해 공지합니다.{"\n"}
        3. 이용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단할 수
        있으며, 계속 서비스를 이용하는 경우 변경된 약관에 동의한 것으로
        간주합니다.
      </Text>

      <Text style={styles.termSectionTitle}>제4조 (서비스 이용)</Text>
      <Text style={styles.termText}>
        1. 서비스 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한
        연중무휴, 1일 24시간을 원칙으로 합니다.{"\n"}
        2. 회사는 서비스 제공에 필요한 경우 정기점검을 실시할 수 있으며, 이러한
        경우 사전에 공지합니다.
      </Text>

      <Text style={styles.termSectionTitle}>제5조 (서비스 제공의 중지)</Text>
      <Text style={styles.termText}>
        회사는 다음 각 호의 경우 서비스 제공을 중지할 수 있습니다.{"\n"}
        1. 서비스용 설비의 보수 등 공사로 인한 부득이한 경우{"\n"}
        2. 전기통신사업법에 규정된 기간통신사업자가 전기통신서비스를 중지했을
        경우{"\n"}
        3. 기타 불가항력적 사유가 있는 경우
      </Text>

      <Text style={styles.termSectionTitle}>제6조 (이용자의 의무)</Text>
      <Text style={styles.termText}>
        이용자는 다음 각 호의 행위를 하여서는 안 됩니다.{"\n"}
        1. 타인의 정보 도용{"\n"}
        2. 회사가 제공하는 서비스의 정상적인 운영을 방해하는 행위{"\n"}
        3. 서비스를 이용하여 법령 또는 이 약관이 금지하는 행위를 하는 경우{"\n"}
        4. 기타 불법적이거나 부당한 행위
      </Text>

      <Text style={styles.termSectionTitle}>제7조 (저작권)</Text>
      <Text style={styles.termText}>
        서비스에서 제공하는 모든 콘텐츠에 대한 저작권은 회사에 있으며, 이용자는
        회사가 제공하는 서비스를 이용하면서 얻은 정보를 회사의 사전 승낙 없이
        복제, 송신, 출판, 배포, 방송 등 기타 방법에 의하여 영리목적으로
        이용하거나 제3자에게 이용하게 해서는 안 됩니다.
      </Text>
    </ScrollView>
  );

  // 개인정보 처리방침 내용
  const PrivacyTermsContent = () => (
    <ScrollView style={styles.modalContent}>
      <Text style={styles.termSectionTitle}>
        제1조 (개인정보의 수집 및 이용 목적)
      </Text>
      <Text style={styles.termText}>
        회사는 다음과 같은 목적을 위해 개인정보를 수집 및 이용합니다.{"\n"}
        1. 서비스 제공 및 계정 관리{"\n"}
        2. 서비스 개선 및 개발{"\n"}
        3. 안전한 서비스 제공 및 부정 이용 방지{"\n"}
        4. 법적 요구사항 준수
      </Text>

      <Text style={styles.termSectionTitle}>
        제2조 (수집하는 개인정보 항목)
      </Text>
      <Text style={styles.termText}>
        회사는 다음과 같은 개인정보를 수집할 수 있습니다.{"\n"}
        1. 필수항목: 이메일 주소, 비밀번호, 닉네임{"\n"}
        2. 선택항목: 프로필 이미지{"\n"}
        3. 자동 수집 항목: 기기 정보, IP 주소, 앱 사용 기록, 쿠키
      </Text>

      <Text style={styles.termSectionTitle}>
        제3조 (개인정보의 보유 및 이용기간)
      </Text>
      <Text style={styles.termText}>
        회사는 원칙적으로 이용자의 개인정보를 회원 탈퇴 시까지 보유합니다. 단,
        관계 법령에 의해 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안
        보관합니다.
      </Text>

      <Text style={styles.termSectionTitle}>제4조 (개인정보의 제3자 제공)</Text>
      <Text style={styles.termText}>
        회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만,
        다음의 경우에는 예외로 합니다.{"\n"}
        1. 이용자가 사전에 동의한 경우{"\n"}
        2. 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에
        따라 수사기관의 요구가 있는 경우
      </Text>

      <Text style={styles.termSectionTitle}>
        제5조 (개인정보의 안전성 확보 조치)
      </Text>
      <Text style={styles.termText}>
        회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
        {"\n"}
        1. 관리적 조치: 내부관리계획 수립 및 시행, 정기적 직원 교육{"\n"}
        2. 기술적 조치: 개인정보처리시스템 접근 제한, 암호화 기술 적용, 접속기록
        보관{"\n"}
        3. 물리적 조치: 전산실, 자료보관실 등의 접근통제
      </Text>

      <Text style={styles.termSectionTitle}>
        제6조 (이용자의 권리와 행사 방법)
      </Text>
      <Text style={styles.termText}>
        이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제, 처리정지 요구 등의
        권리를 행사할 수 있으며, 이는 서비스 내 설정 메뉴 또는 고객센터를 통해
        가능합니다.
      </Text>

      <Text style={styles.termSectionTitle}>제7조 (개인정보 보호책임자)</Text>
      <Text style={styles.termText}>
        회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와
        관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보
        보호책임자를 지정하고 있습니다.{"\n\n"}- 개인정보 보호책임자: 플랜이지
        개인정보보호팀{"\n"}- 연락처: privacy@planizy.com
      </Text>
    </ScrollView>
  );

  // 마케팅 정보 수신 동의 내용
  const MarketingTermsContent = () => (
    <ScrollView style={styles.modalContent}>
      <Text style={styles.termText}>
        플랜이지는 이용자에게 유용한 서비스 정보, 이벤트 안내, 프로모션 정보
        등의 마케팅 정보를 제공하기 위해 다음과 같이 마케팅 정보 수신에 대한
        동의를 받고 있습니다.
      </Text>

      <Text style={styles.termSectionTitle}>마케팅 정보 수신 동의 내용</Text>
      <Text style={styles.termSubSectionTitle}>1. 수집 및 이용 목적</Text>
      <Text style={styles.termText}>
        - 새로운 서비스 및 기능 안내{"\n"}- 이벤트, 프로모션 정보 제공{"\n"}-
        혜택 및 할인 정보 제공{"\n"}- 맞춤형 서비스 및 콘텐츠 추천
      </Text>

      <Text style={styles.termSubSectionTitle}>2. 수집 항목</Text>
      <Text style={styles.termText}>
        - 이메일 주소{"\n"}- 푸시 알림 수신 상태
      </Text>

      <Text style={styles.termSubSectionTitle}>3. 보유 및 이용 기간</Text>
      <Text style={styles.termText}>
        - 회원 탈퇴 또는 마케팅 정보 수신 동의 철회 시까지
      </Text>

      <Text style={styles.termSectionTitle}>마케팅 정보 수신 거부 방법</Text>
      <Text style={styles.termText}>
        이용자는 언제든지 마케팅 정보 수신에 대한 동의를 철회할 수 있으며, 철회
        방법은 다음과 같습니다.{"\n"}
        1. 서비스 내 '알림 설정'에서 변경{"\n"}
        2. 이메일 하단의 '수신거부' 링크 클릭{"\n"}
        3. 고객센터(support@planizy.com)로 요청
      </Text>

      <Text style={styles.termSectionTitle}>
        마케팅 정보 수신 동의 거부에 따른 불이익
      </Text>
      <Text style={styles.termText}>
        마케팅 정보 수신 동의를 거부하시더라도 플랜이지의 기본 서비스 이용에는
        제한이 없습니다. 다만, 이벤트, 혜택 등의 정보를 받아보실 수 없습니다.
      </Text>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.container}>
        <Text style={styles.title}>이용약관 동의</Text>
        <Text style={styles.subtitle}>
          플랜이지 서비스 이용을 위해 약관에 동의해주세요.
        </Text>

        {/* 전체 동의 */}
        <TouchableOpacity
          style={styles.allAgreeContainer}
          onPress={() => handleAgreeAll(!allRequired || !marketingTermsAgreed)}
        >
          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkbox,
                allRequired && marketingTermsAgreed && styles.checkboxChecked,
              ]}
            >
              {allRequired && marketingTermsAgreed && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.allAgreeText}>모두 동의합니다</Text>
          </View>
        </TouchableOpacity>

        <ScrollView style={styles.termsContainer}>
          {/* 서비스 이용약관 */}
          <View style={styles.termItem}>
            <View style={styles.termHeader}>
              <View style={styles.termTitleContainer}>
                <View
                  style={[
                    styles.checkbox,
                    serviceTermsAgreed && styles.checkboxChecked,
                  ]}
                >
                  {serviceTermsAgreed && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.termTitle}>서비스 이용약관 (필수)</Text>
              </View>
              <Switch
                trackColor={{ false: "#e0e0e0", true: "#a8e8e0" }}
                thumbColor={serviceTermsAgreed ? "#50cebb" : "#f4f3f4"}
                value={serviceTermsAgreed}
                onValueChange={setServiceTermsAgreed}
              />
            </View>
            <TouchableOpacity
              onPress={() =>
                openTermsModal("서비스 이용약관", <ServiceTermsContent />)
              }
              style={styles.viewFullTermsButton}
            >
              <Text style={styles.viewFullTerms}>전문 보기</Text>
            </TouchableOpacity>
          </View>

          {/* 개인정보 처리방침 */}
          <View style={styles.termItem}>
            <View style={styles.termHeader}>
              <View style={styles.termTitleContainer}>
                <View
                  style={[
                    styles.checkbox,
                    privacyTermsAgreed && styles.checkboxChecked,
                  ]}
                >
                  {privacyTermsAgreed && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.termTitle}>개인정보 처리방침 (필수)</Text>
              </View>
              <Switch
                trackColor={{ false: "#e0e0e0", true: "#a8e8e0" }}
                thumbColor={privacyTermsAgreed ? "#50cebb" : "#f4f3f4"}
                value={privacyTermsAgreed}
                onValueChange={setPrivacyTermsAgreed}
              />
            </View>
            <TouchableOpacity
              onPress={() =>
                openTermsModal("개인정보 처리방침", <PrivacyTermsContent />)
              }
              style={styles.viewFullTermsButton}
            >
              <Text style={styles.viewFullTerms}>전문 보기</Text>
            </TouchableOpacity>
          </View>

          {/* 마케팅 정보 수신 동의 */}
          <View style={styles.termItem}>
            <View style={styles.termHeader}>
              <View style={styles.termTitleContainer}>
                <View
                  style={[
                    styles.checkbox,
                    marketingTermsAgreed && styles.checkboxChecked,
                  ]}
                >
                  {marketingTermsAgreed && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.termTitle}>
                  마케팅 정보 수신 동의 (선택)
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#e0e0e0", true: "#a8e8e0" }}
                thumbColor={marketingTermsAgreed ? "#50cebb" : "#f4f3f4"}
                value={marketingTermsAgreed}
                onValueChange={setMarketingTermsAgreed}
              />
            </View>
            <Text style={styles.termDescription}>
              이벤트 및 혜택 정보를 받아보실 수 있습니다.
            </Text>
            <TouchableOpacity
              onPress={() =>
                openTermsModal(
                  "마케팅 정보 수신 동의",
                  <MarketingTermsContent />
                )
              }
              style={styles.viewFullTermsButton}
            >
              <Text style={styles.viewFullTerms}>전문 보기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.agreeButton, !allRequired && styles.disabledButton]}
          onPress={handleAgree}
          disabled={!allRequired}
        >
          <Text style={styles.agreeButtonText}>동의하고 시작하기</Text>
        </TouchableOpacity>

        {/* 약관 전문 모달 */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {modalContent}
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 25,
  },
  allAgreeContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#50cebb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#50cebb",
  },
  allAgreeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  termsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  termItem: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  termHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  termTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  termTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  termDescription: {
    fontSize: 14,
    color: "#888",
    marginTop: 5,
    marginBottom: 10,
  },
  viewFullTermsButton: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  viewFullTerms: {
    fontSize: 14,
    color: "#50cebb",
    textDecorationLine: "underline",
  },
  agreeButton: {
    backgroundColor: "#50cebb",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  agreeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // 모달 스타일
  modalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 50,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
    padding: 15,
  },
  termSectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  termSubSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
    marginTop: 15,
    marginBottom: 5,
  },
  termText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    marginBottom: 15,
  },
});

export default TermsAgreementScreen;
