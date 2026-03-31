# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.swmansion.** { *; }

# Expo modules
-keep class expo.modules.** { *; }

# OkHttp (used for fetch API)
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }

# Keep native methods
-keepclassmembers class * {
    native <methods>;
}

# Reduce APK size
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
