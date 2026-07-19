import 'package:flutter_test/flutter_test.dart';

import 'package:paycam/main.dart';

void main() {
  testWidgets('PayCam app boots to the splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const PayCamApp());
    expect(find.text('PayCam'), findsOneWidget);
  });
}
