// App.js
import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context"; // ✅ 추가

import { PostProvider } from "./app/components/PostContext";
import { UserProvider } from "./app/context/UserContext";
import { theme } from "./app/core/theme";

// 스크린들
import StartScreen from "./app/screens/StartScreen";
import LoginScreen from "./app/screens/LoginScreen";
import RegisterScreen from "./app/screens/RegisterScreen";
import ResetPasswordScreen from "./app/screens/ResetPasswordScreen";
import HomeScreen from "./app/screens/HomeScreen";
import OnboardingScreen from "./app/screens/OnboardingScreen";

// 커뮤니티
import CommunityScreen from "./app/screens/CommunityScreen";
import CommunityWriteScreen from "./app/screens/CommunityWriteScreen";
import CommunitySelectScreen from "./app/screens/CommunitySelectScreen";
import CommunityEditScreen from "./app/screens/CommunityEditScreen";
import CommunityDetailScreen from "./app/screens/CommunityDetailScreen";

// 새 비밀번호 설정 완료 단계
import NewPasswordScreen from "./app/screens/NewPasswordScreen";

// ✅ 추가: 관련 법규 & 업체
import FirstAidGuideScreen from "./app/screens/FirstAidGuideScreen";
import CompanyLoginScreen from "./app/screens/CompanyLoginScreen";
import CompanyMapScreen from "./app/screens/CompanyMapScreen";
import MyPageScreen from "./app/screens/MyPageScreen";
import HistoryListScreen from "./app/screens/HistoryListScreen";

import PaymentHistoryScreen from "./app/screens/PaymentHistoryScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <PostProvider>
      <UserProvider>
        <PaperProvider theme={theme}>
          {/* ✅ SafeArea 루트 프로바이더로 경고 제거 */}
          <SafeAreaProvider>
            <NavigationContainer>
              {/* ✅ 초기 라우트를 StartScreen으로 변경 */}
              <Stack.Navigator
                initialRouteName="StartScreen"
                screenOptions={{ headerShown: false }}
              >
                <Stack.Screen
                  name="HistoryListScreen"
                  component={HistoryListScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="PaymentHistoryScreen"
                  component={PaymentHistoryScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="MyPageScreen" component={MyPageScreen} />
                {/* 필요 시 온보딩은 이후에 진입하도록 유지만 등록 */}
                <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />

                <Stack.Screen name="StartScreen" component={StartScreen} />
                <Stack.Screen name="LoginScreen" component={LoginScreen} />
                <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
                <Stack.Screen name="HomeScreen" component={HomeScreen} />
                <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />

                {/* 커뮤니티 */}
                <Stack.Screen
                  name="CommunityScreen"
                  component={CommunityScreen}
                  options={{
                    headerShown: false,
                    // ✅ 오른쪽 스와이프 시, 새 화면이 "왼쪽에서" 들어오도록
                    gestureDirection: "horizontal-inverted",
                    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                  }}
                />
                <Stack.Screen name="CommunityWriteScreen" component={CommunityWriteScreen} />
                <Stack.Screen name="CommunitySelectScreen" component={CommunitySelectScreen} />
                <Stack.Screen name="CommunityEditScreen" component={CommunityEditScreen} />
                <Stack.Screen name="CommunityDetailScreen" component={CommunityDetailScreen} />

                {/* 새 비밀번호 설정 완료 단계 */}
                <Stack.Screen name="NewPasswordScreen" component={NewPasswordScreen} />

                {/* 기타 */}
                <Stack.Screen
                  name="FirstAidGuideScreen"
                  component={FirstAidGuideScreen}
                  options={{
                    headerShown: false,
                    // ✅ 오른쪽 스와이프 시, 새 화면이 "왼쪽에서" 들어오도록
                    gestureDirection: "horizontal-inverted",
                    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                  }}
                />
                <Stack.Screen
                  name="CompanyLoginScreen"
                  component={CompanyLoginScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="CompanyMapScreen"
                  component={CompanyMapScreen}
                  options={{ title: "업체 페이지", headerShown: true }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaProvider>
        </PaperProvider>
      </UserProvider>
    </PostProvider>
  );
}
